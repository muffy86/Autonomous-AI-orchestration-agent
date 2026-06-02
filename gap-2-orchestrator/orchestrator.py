#!/usr/bin/env python3
"""
Gap 2: Local FastAPI Orchestrator
Replaces Make.com "Max Config" scenario with agent-native orchestration
Proper retry/backoff, dead-letter queue, webhook routing
"""

import asyncio
import hashlib
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum

# Optional FastAPI - gracefully degrade if not installed
try:
    from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
    from fastapi.responses import JSONResponse
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    print("[!] FastAPI not installed. Run: pip install fastapi uvicorn")

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False
    print("[!] httpx not installed. Run: pip install httpx")

REPO_ROOT = Path(__file__).parent.parent.resolve()
ORCH_DIR = REPO_ROOT / "gap-2-orchestrator"
QUEUE_DIR = ORCH_DIR / "queue"
DLQ_DIR = ORCH_DIR / "dlq"
LOGS_DIR = ORCH_DIR / "logs"


class JobStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DLQ = "dlq"  # Dead letter queue


@dataclass
class Job:
    id: str
    webhook_id: str
    payload: dict
    timestamp: str
    status: str
    attempts: int = 0
    max_attempts: int = 3
    last_error: Optional[str] = None
    
    def to_dict(self) -> dict:
        return asdict(self)


class DeadLetterQueue:
    """Queue for jobs that exceeded max retries"""
    
    def __init__(self, dlq_dir: Path = DLQ_DIR):
        self.dlq_dir = dlq_dir
        self.dlq_dir.mkdir(parents=True, exist_ok=True)
    
    def add(self, job: Job, reason: str):
        """Add failed job to DLQ"""
        entry = {
            "job": job.to_dict(),
            "dlq_timestamp": datetime.utcnow().isoformat(),
            "dlq_reason": reason,
            "manual_review_url": f"/dlq/review/{job.id}"
        }
        
        dlq_file = self.dlq_dir / f"{job.id}.json"
        with open(dlq_file, 'w') as f:
            json.dump(entry, f, indent=2)
    
    def list(self) -> List[dict]:
        """List all DLQ entries"""
        entries = []
        for f in sorted(self.dlq_dir.glob("*.json")):
            with open(f, 'r') as fp:
                entries.append(json.load(fp))
        return entries
    
    def retry(self, job_id: str) -> Optional[Job]:
        """Retry a DLQ job"""
        dlq_file = self.dlq_dir / f"{job_id}.json"
        if not dlq_file.exists():
            return None
        
        with open(dlq_file, 'r') as f:
            entry = json.load(f)
        
        job_data = entry["job"]
        job_data["status"] = JobStatus.PENDING.value
        job_data["attempts"] = 0
        job_data["last_error"] = None
        
        # Remove from DLQ
        dlq_file.unlink()
        
        return Job(**job_data)


class EventQueue:
    """Persistent job queue with retry logic"""
    
    def __init__(self, queue_dir: Path = QUEUE_DIR, dlq: Optional[DeadLetterQueue] = None):
        self.queue_dir = queue_dir
        self.queue_dir.mkdir(parents=True, exist_ok=True)
        self.dlq = dlq or DeadLetterQueue()
        self._memory_queue: List[Job] = []
    
    def enqueue(self, webhook_id: str, payload: dict) -> str:
        """Add job to queue"""
        job_id = hashlib.sha256(
            f"{webhook_id}-{datetime.utcnow().isoformat()}-{id(payload)}".encode()
        ).hexdigest()[:16]
        
        job = Job(
            id=job_id,
            webhook_id=webhook_id,
            payload=payload,
            timestamp=datetime.utcnow().isoformat(),
            status=JobStatus.PENDING.value,
            attempts=0,
            max_attempts=3
        )
        
        # Persist to disk
        job_file = self.queue_dir / f"{job.id}.json"
        with open(job_file, 'w') as f:
            json.dump(job.to_dict(), f)
        
        # Add to memory queue
        self._memory_queue.append(job)
        
        return job.id
    
    def dequeue(self) -> Optional[Job]:
        """Get next pending job"""
        # Load from disk if memory queue empty
        if not self._memory_queue:
            for f in sorted(self.queue_dir.glob("*.json")):
                with open(f, 'r') as fp:
                    data = json.load(fp)
                    if data.get("status") == JobStatus.PENDING.value:
                        self._memory_queue.append(Job(**data))
        
        # Return next pending
        for job in self._memory_queue:
            if job.status == JobStatus.PENDING.value:
                job.status = JobStatus.PROCESSING.value
                self._save_job(job)
                return job
        
        return None
    
    def _save_job(self, job: Job):
        """Persist job state"""
        job_file = self.queue_dir / f"{job.id}.json"
        with open(job_file, 'w') as f:
            json.dump(job.to_dict(), f)
    
    def complete(self, job_id: str):
        """Mark job as completed"""
        job_file = self.queue_dir / f"{job_id}.json"
        if job_file.exists():
            job_file.unlink()
        
        self._memory_queue = [j for j in self._memory_queue if j.id != job_id]
    
    def fail(self, job: Job, error: str):
        """Handle job failure with retry logic"""
        job.attempts += 1
        job.last_error = error
        
        if job.attempts >= job.max_attempts:
            # Move to DLQ
            job.status = JobStatus.DLQ.value
            self.dlq.add(job, f"Max retries exceeded: {error}")
            
            job_file = self.queue_dir / f"{job.id}.json"
            if job_file.exists():
                job_file.unlink()
        else:
            # Retry with exponential backoff
            job.status = JobStatus.PENDING.value
            self._save_job(job)
            
            # Exponential backoff: 2^attempt seconds
            backoff = 2 ** job.attempts
            time.sleep(backoff)
    
    def stats(self) -> dict:
        """Queue statistics"""
        pending = len([j for j in self._memory_queue if j.status == JobStatus.PENDING.value])
        processing = len([j for j in self._memory_queue if j.status == JobStatus.PROCESSING.value])
        dlq_count = len(list(self.dlq.dlq_dir.glob("*.json")))
        
        return {
            "pending": pending,
            "processing": processing,
            "dlq": dlq_count,
            "total": pending + processing + dlq_count
        }


class WebhookRouter:
    """Routes webhooks to appropriate handlers with retry logic"""
    
    def __init__(self, queue: EventQueue):
        self.queue = queue
        self.handlers: Dict[str, Callable] = {}
        self.routes: Dict[str, dict] = {}
    
    def register(self, webhook_id: str, target_url: Optional[str] = None, 
                 handler: Optional[Callable] = None):
        """Register a webhook route"""
        self.routes[webhook_id] = {
            "target_url": target_url,
            "handler": handler,
            "created_at": datetime.utcnow().isoformat()
        }
        
        if handler:
            self.handlers[webhook_id] = handler
    
    async def handle(self, webhook_id: str, payload: dict) -> str:
        """Handle incoming webhook"""
        if webhook_id not in self.routes:
            raise HTTPException(status_code=404, detail="Webhook not found")
        
        # Queue the job
        job_id = self.queue.enqueue(webhook_id, payload)
        
        return job_id
    
    async def process_job(self, job: Job):
        """Process a queued job"""
        route = self.routes.get(job.webhook_id)
        if not route:
            self.queue.fail(job, "Route not found")
            return
        
        try:
            # Call handler if registered
            if route.get("handler"):
                await route["handler"](job.payload)
            
            # Forward to target URL if configured
            if route.get("target_url") and HAS_HTTPX:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        route["target_url"],
                        json=job.payload,
                        headers={"X-Job-ID": job.id}
                    )
                    response.raise_for_status()
            
            # Success
            self.queue.complete(job.id)
            
        except Exception as e:
            self.queue.fail(job, str(e))


# FastAPI application
app: Optional[FastAPI] = None
orchestrator: Optional['Orchestrator'] = None

if HAS_FASTAPI:
    app = FastAPI(title="Sovereign Orchestrator", version="1.0.0")
    
    @app.on_event("startup")
    async def startup():
        global orchestrator
        orchestrator = Orchestrator()
        asyncio.create_task(orchestrator.worker_loop())
    
    @app.post("/webhook/{webhook_id}")
    async def receive_webhook(webhook_id: str, request: Request):
        """Receive webhook and queue for processing"""
        payload = await request.json()
        job_id = await orchestrator.router.handle(webhook_id, payload)
        return {"status": "queued", "job_id": job_id}
    
    @app.get("/queue/stats")
    async def queue_stats():
        """Get queue statistics"""
        return orchestrator.queue.stats()
    
    @app.get("/dlq/list")
    async def dlq_list():
        """List dead letter queue"""
        return orchestrator.queue.dlq.list()
    
    @app.post("/dlq/retry/{job_id}")
    async def dlq_retry(job_id: str):
        """Retry a DLQ job"""
        job = orchestrator.queue.dlq.retry(job_id)
        if job:
            orchestrator.queue._memory_queue.append(job)
            return {"status": "retry queued", "job_id": job_id}
        raise HTTPException(status_code=404, detail="Job not found in DLQ")
    
    @app.get("/health")
    async def health():
        """Health check"""
        return {
            "status": "healthy",
            "queue": orchestrator.queue.stats()
        }


class Orchestrator:
    """Main orchestrator class"""
    
    def __init__(self):
        self.queue = EventQueue()
        self.router = WebhookRouter(self.queue)
        self.running = False
        
        # Register default routes from env
        self._load_routes_from_env()
    
    def _load_routes_from_env(self):
        """Load webhook routes from environment variables"""
        # Format: ORCH_ROUTE_<name>=target_url
        for key, value in os.environ.items():
            if key.startswith("ORCH_ROUTE_"):
                webhook_id = key.replace("ORCH_ROUTE_", "").lower()
                self.router.register(webhook_id, target_url=value)
    
    async def worker_loop(self):
        """Background worker that processes jobs"""
        self.running = True
        
        while self.running:
            job = self.queue.dequeue()
            
            if job:
                await self.router.process_job(job)
            else:
                await asyncio.sleep(1)  # Poll interval
    
    def stop(self):
        """Stop the orchestrator"""
        self.running = False
    
    def register_handler(self, webhook_id: str, handler: Callable):
        """Register a Python handler for a webhook"""
        self.router.register(webhook_id, handler=handler)


# Standalone usage without FastAPI
class SimpleOrchestrator(Orchestrator):
    """Lightweight orchestrator for CLI/script use"""
    
    def process_immediately(self, webhook_id: str, payload: dict):
        """Process a single job synchronously"""
        job_id = self.queue.enqueue(webhook_id, payload)
        job = self.queue.dequeue()
        
        if job:
            asyncio.run(self.router.process_job(job))
            return job_id
        
        return None


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Event Orchestrator")
    parser.add_argument("action", choices=["serve", "enqueue", "stats", "dlq"])
    parser.add_argument("--webhook-id")
    parser.add_argument("--payload", default="{}")
    parser.add_argument("--port", type=int, default=8000)
    
    args = parser.parse_args()
    
    if args.action == "serve":
        if not HAS_FASTAPI:
            print("[!] FastAPI required for server mode")
            sys.exit(1)
        
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    
    elif args.action == "enqueue":
        orch = SimpleOrchestrator()
        if args.webhook_id:
            payload = json.loads(args.payload)
            job_id = orch.process_immediately(args.webhook_id, payload)
            print(f"[+] Job processed: {job_id}")
    
    elif args.action == "stats":
        orch = SimpleOrchestrator()
        print(json.dumps(orch.queue.stats(), indent=2))
    
    elif args.action == "dlq":
        orch = SimpleOrchestrator()
        for entry in orch.queue.dlq.list():
            print(f"DLQ: {entry['job']['id']} - {entry['dlq_reason'][:50]}")
