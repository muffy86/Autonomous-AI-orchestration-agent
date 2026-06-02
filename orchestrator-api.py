#!/usr/bin/env python3
"""
orchestrator-api.py - Self-hosted FastAPI event router
Replaces Make.com "AI Agent - Max Config" with retry/backoff + DLQ
"""

import json
import os
import sys
import asyncio
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
import uvicorn

# Config
DATA_DIR = Path.home() / ".orchestrator"
QUEUE_DIR = DATA_DIR / "queue"
DLQ_DIR = DATA_DIR / "dlq"
LOG_FILE = DATA_DIR / "events.logl"

MAX_RETRIES = 3
RETRY_DELAYS = [5, 30, 300]  # seconds
HMAC_SECRET = os.getenv("ORCH_SECRET", "change-me-in-production")

DATA_DIR.mkdir(parents=True, exist_ok=True)
QUEUE_DIR.mkdir(exist_ok=True)
DLQ_DIR.mkdir(exist_ok=True)


# === Data Models ===

class WebhookEvent(BaseModel):
    id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source: str  # 'telegram', 'github', 'manual', 'schedule'
    event_type: str  # 'task.create', 'task.complete', 'research.start', etc.
    payload: Dict[str, Any]
    webhook_url: Optional[str] = None  # Where to POST next
    retry_count: int = 0
    priority: int = 1


class RouteConfig(BaseModel):
    """Dynamic routing rules (loaded from config)."""
    source: str
    event_type: str
    target: str  # URL to POST to
    condition: Optional[str] = None  # Simple eval: "payload.priority > 3"
    transform: Optional[str] = None  # Jinja2 template for payload rewrite


# === Core Classes ===

class EventQueue:
    """Persistent JSONL queue with atomic writes."""
    
    def __init__(self, queue_dir: Path):
        self.queue_dir = queue_dir
    
    def _make_id(self, event: dict) -> str:
        data = f"{event['timestamp']}:{event['source']}:{json.dumps(event['payload'], sort_keys=True)}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def enqueue(self, event: dict) -> str:
        """Add event to queue, return ID."""
        if not event.get("id"):
            event["id"] = self._make_id(event)
        
        qfile = self.queue_dir / f"{event['id']}.json"
        temp = qfile.with_suffix('.tmp')
        temp.write_text(json.dumps(event))
        temp.rename(qfile)
        
        # Also append to log
        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps(event) + '\n')
        
        return event["id"]
    
    def dequeue(self) -> Optional[dict]:
        """Get next pending event."""
        for qfile in sorted(self.queue_dir.glob("*.json")):
            try:
                return json.loads(qfile.read_text())
            except:
                qfile.unlink()
        return None
    
    def remove(self, event_id: str) -> bool:
        """Remove processed event."""
        qfile = self.queue_dir / f"{event_id}.json"
        if qfile.exists():
            qfile.unlink()
            return True
        return False
    
    def move_to_dlq(self, event: dict):
        """Dead letter queue for failed events."""
        dlq_file = DLQ_DIR / f"{event['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        event["dlq_at"] = datetime.now(timezone.utc).isoformat()
        dlq_file.write_text(json.dumps(event))
        self.remove(event["id"])
    
    def count(self) -> int:
        return len(list(self.queue_dir.glob("*.json")))


class Router:
    """Dynamic event routing with retry logic."""
    
    def __init__(self, queue: EventQueue):
        self.queue = queue
        self.routes: List[RouteConfig] = self._load_routes()
        self.handlers: Dict[str, Callable] = {}
    
    def _load_routes(self) -> List[RouteConfig]:
        """Load routing config from disk."""
        config_file = DATA_DIR / "routes.json"
        if not config_file.exists():
            return []
        data = json.loads(config_file.read_text())
        return [RouteConfig(**r) for r in data.get("routes", [])]
    
    def register_handler(self, event_type: str, handler: Callable):
        """Register Python function handler."""
        self.handlers[event_type] = handler
    
    async def process_event(self, event: dict) -> bool:
        """Route event to target. Returns success bool."""
        
        # 1. Check registered handlers first
        handler = self.handlers.get(event.get("event_type"))
        if handler:
            try:
                await handler(event)
                return True
            except Exception as e:
                print(f"[orchestrator] Handler error: {e}")
                return False
        
        # 2. Check webhook routes
        for route in self.routes:
            if route.source == event.get("source") and route.event_type == event.get("event_type"):
                return await self._webhook_call(route.target, event)
        
        # 3. Fallback: direct webhook_url in event
        if event.get("webhook_url"):
            return await self._webhook_call(event["webhook_url"], event)
        
        return False
    
    async def _webhook_call(self, url: str, event: dict) -> bool:
        """POST to webhook with retry."""
        headers = {
            "Content-Type": "application/json",
            "X-Orch-Signature": self._sign(event),
            "X-Orch-Retry": str(event.get("retry_count", 0))
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, json=event["payload"], headers=headers)
                return resp.status_code < 500
            except Exception as e:
                print(f"[orchestrator] Webhook error: {e}")
                return False
    
    def _sign(self, event: dict) -> str:
        """HMAC signature for webhook security."""
        body = json.dumps(event["payload"], sort_keys=True)
        sig = hmac.new(HMAC_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        return f"sha256={sig}"


class Worker:
    """Background worker that drains the queue."""
    
    def __init__(self, queue: EventQueue, router: Router):
        self.queue = queue
        self.router = router
        self.running = False
    
    async def start(self):
        """Start worker loop."""
        self.running = True
        print("[orchestrator] Worker started")
        
        while self.running:
            event = self.queue.dequeue()
            if not event:
                await asyncio.sleep(1)
                continue
            
            print(f"[orchestrator] Processing: {event['id']}")
            success = await self.router.process_event(event)
            
            if success:
                self.queue.remove(event["id"])
                print(f"[orchestrator] ✓ {event['id']}")
            else:
                event["retry_count"] = event.get("retry_count", 0) + 1
                
                if event["retry_count"] > MAX_RETRIES:
                    self.queue.move_to_dlq(event)
                    print(f"[orchestrator] ✗ DLQ: {event['id']}")
                else:
                    delay = RETRY_DELAYS[min(event["retry_count"]-1, len(RETRY_DELAYS)-1)]
                    # Re-queue with delay (simplified: just keep in queue, worker will retry)
                    print(f"[orchestrator] Retry {event['retry_count']} in {delay}s: {event['id']}")
                    await asyncio.sleep(delay)
    
    def stop(self):
        self.running = False


# === Global State ===

queue = EventQueue(QUEUE_DIR)
router = Router(queue)
worker = Worker(queue, router)

# === FastAPI App ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    worker_task = asyncio.create_task(worker.start())
    yield
    # Shutdown
    worker.stop()

app = FastAPI(
    title="Sovereign Orchestrator",
    description="Agent-native event router, Make.com replacement",
    version="1.0.0",
    lifespan=lifespan
)

# === Routes ===

@app.post("/v1/events", response_model=Dict)
async def ingest_event(event: WebhookEvent, background: BackgroundTasks):
    """Ingest event into queue."""
    event_data = event.dict()
    event_id = queue.enqueue(event_data)
    return {"id": event_id, "status": "queued", "queue_depth": queue.count()}


@app.post("/v1/events/sync")
async def ingest_sync(event: WebhookEvent):
    """Ingest and process synchronously (for webhooks that need immediate response)."""
    success = await router.process_event(event.dict())
    return {"processed": success}


@app.get("/v1/health")
async def health():
    return {
        "status": "healthy",
        "queue_depth": queue.count(),
        "dlq_count": len(list(DLQ_DIR.glob("*.json"))),
        "routes_loaded": len(router.routes)
    }


@app.get("/v1/queue")
async def get_queue():
    return {"count": queue.count(), "events": [f.stem for f in QUEUE_DIR.glob("*.json")]}


@app.get("/v1/dlq")
async def get_dlq():
    dead = [json.loads(f.read_text()) for f in DLQ_DIR.glob("*.json")]
    return {"count": len(dead), "events": dead}


@app.post("/v1/dlq/{event_id}/retry")
async def retry_dlq(event_id: str):
    """Move DLQ item back to main queue for retry."""
    for dlq_file in DLQ_DIR.glob("*.json"):
        if event_id in dlq_file.name:
            data = json.loads(dlq_file.read_text())
            data["retry_count"] = 0
            queue.enqueue(data)
            dlq_file.unlink()
            return {"status": "requeued", "id": event_id}
    raise HTTPException(404, "Event not found in DLQ")


@app.post("/v1/routes/reload")
async def reload_routes():
    """Hot-reload routing config."""
    router.routes = router._load_routes()
    return {"routes_loaded": len(router.routes)}


# === Webhook Receivers (Drop-in replacements for Make.com webhooks) ===

@app.post("/v1/webhook/telegram")
async def telegram_webhook(request: Request):
    """Receive Telegram bot updates."""
    data = await request.json()
    event = WebhookEvent(
        source="telegram",
        event_type="telegram.message" if data.get("message") else "telegram.callback",
        payload=data
    )
    event_id = queue.enqueue(event.dict())
    return {"ok": True, "event_id": event_id}


@app.post("/v1/webhook/github")
async def github_webhook(request: Request):
    """Receive GitHub webhooks."""
    data = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "unknown")
    event = WebhookEvent(
        source="github",
        event_type=f"github.{event_type}",
        payload=data
    )
    event_id = queue.enqueue(event.dict())
    return {"ok": True, "event_id": event_id}


# === Built-in Handlers ===

async def telegram_handler(event: dict):
    """Process Telegram events - forward to ECHO Nexus."""
    # This bridges Telegram bot -> task queue
    from pathlib import Path
    tasks_file = Path.home() / ".echo-nexus" / "tasks.jsonl"
    tasks_file.parent.mkdir(parents=True, exist_ok=True)
    
    msg = event["payload"].get("message", {})
    task = {
        "id": f"orch_{event['id']}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "text": msg.get("text", ""),
        "source": "orchestrator_telegram",
        "status": "pending"
    }
    
    with open(tasks_file, 'a') as f:
        f.write(json.dumps(task) + "\n")

# Register handlers
router.register_handler("telegram.message", telegram_handler)


# === CLI ===

def cli():
    import argparse
    parser = argparse.ArgumentParser(description="Sovereign Orchestrator")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--add-route", help="Add route: source:event_type:target_url")
    args = parser.parse_args()
    
    if args.add_route:
        src, evt, tgt = args.add_route.split(":", 2)
        routes_file = DATA_DIR / "routes.json"
        routes = json.loads(routes_file.read_text()) if routes_file.exists() else {"routes": []}
        routes["routes"].append({
            "source": src,
            "event_type": evt,
            "target": tgt
        })
        routes_file.write_text(json.dumps(routes, indent=2))
        print(f"[orchestrator] Added route: {src}/{evt} -> {tgt}")
        return
    
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    cli()