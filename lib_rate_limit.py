#!/usr/bin/env python3
"""
Production rate limiting with sliding window algorithm.
Real implementation - no theater.
"""

import time
import hashlib
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from collections import deque
from threading import RLock
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import functools


@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    max_requests: int
    window_seconds: float
    burst_allowance: int = 0  # Extra requests allowed in burst


@dataclass
class RateLimitState:
    """Sliding window rate limit state."""
    requests: deque  # Timestamps of requests
    lock: RLock
    
    def __init__(self):
        self.requests = deque()
        self.lock = RLock()


class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter - production ready.
    
    Features:
    - Sliding window algorithm (more accurate than fixed window)
    - Per-client tracking (by IP or API key)
    - Thread-safe
    - Configurable burst allowance
    - Real metrics
    """
    
    def __init__(self):
        self._clients: Dict[str, RateLimitState] = {}
        self._lock = RLock()
        
        # Metrics
        self.total_requests = 0
        self.total_rate_limited = 0
    
    def _get_client_key(self, request: Request) -> str:
        """Generate client identifier from request."""
        # Try API key first
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{hashlib.sha256(api_key.encode()).hexdigest()[:16]}"
        
        # Fall back to IP + User-Agent
        client_ip = "unknown"
        if hasattr(request, 'client') and request.client:
            client_ip = request.client.host
        
        user_agent = request.headers.get("User-Agent", "")[:50]
        return f"ip:{client_ip}:{hashlib.md5(user_agent.encode()).hexdigest()[:8]}"
    
    def _cleanup_old_requests(
        self,
        state: RateLimitState,
        window_seconds: float
    ) -> None:
        """Remove requests outside the sliding window."""
        cutoff = time.time() - window_seconds
        
        while state.requests and state.requests[0] < cutoff:
            state.requests.popleft()
    
    def check_rate_limit(
        self,
        request: Request,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request should be rate limited.
        
        Returns:
            (allowed, info) where info contains rate limit details
        """
        client_key = self._get_client_key(request)
        current_time = time.time()
        
        with self._lock:
            # Get or create client state
            if client_key not in self._clients:
                self._clients[client_key] = RateLimitState()
            
            state = self._clients[client_key]
        
        with state.lock:
            # Cleanup old requests
            self._cleanup_old_requests(state, config.window_seconds)
            
            # Count current requests in window
            current_count = len(state.requests)
            max_allowed = config.max_requests + config.burst_allowance
            
            # Check limit
            allowed = current_count < max_allowed
            
            if allowed:
                # Add this request
                state.requests.append(current_time)
                self.total_requests += 1
            else:
                self.total_rate_limited += 1
            
            # Calculate retry-after (time until oldest request expires)
            retry_after = 0
            if not allowed and state.requests:
                oldest_request = state.requests[0]
                retry_after = int((oldest_request + config.window_seconds) - current_time) + 1
            
            return allowed, {
                "client_key": client_key,
                "current_count": current_count,
                "max_requests": max_allowed,
                "window_seconds": config.window_seconds,
                "retry_after": retry_after,
                "reset_at": int(state.requests[0] + config.window_seconds) if state.requests else 0
            }
    
    def get_metrics(self) -> Dict[str, any]:
        """Get rate limiter metrics."""
        with self._lock:
            return {
                "total_clients": len(self._clients),
                "total_requests": self.total_requests,
                "total_rate_limited": self.total_rate_limited,
                "rate_limited_pct": (
                    self.total_rate_limited / self.total_requests * 100
                    if self.total_requests > 0 else 0
                )
            }


# Global rate limiter instance
_rate_limiter: Optional[SlidingWindowRateLimiter] = None


def get_rate_limiter() -> SlidingWindowRateLimiter:
    """Get global rate limiter instance (singleton)."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = SlidingWindowRateLimiter()
    return _rate_limiter


# Predefined rate limit configs
RATE_LIMITS = {
    "strict": RateLimitConfig(max_requests=10, window_seconds=60),      # 10/min
    "moderate": RateLimitConfig(max_requests=100, window_seconds=60),   # 100/min
    "permissive": RateLimitConfig(max_requests=1000, window_seconds=60), # 1000/min
    "upload": RateLimitConfig(max_requests=5, window_seconds=60, burst_allowance=2),  # 5/min + 2 burst
    "read": RateLimitConfig(max_requests=1000, window_seconds=60),      # 1000/min
    "write": RateLimitConfig(max_requests=100, window_seconds=60),      # 100/min
    "chat": RateLimitConfig(max_requests=20, window_seconds=60),        # 20/min
}


def rate_limit(config_name: str = "moderate"):
    """
    Decorator for rate limiting FastAPI endpoints.
    
    Usage:
        @app.post("/api/chat")
        @rate_limit("chat")
        async def chat_endpoint(request: Request):
            ...
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Find Request object in args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request:
                request = kwargs.get("request")
            
            if not request:
                raise ValueError("rate_limit decorator requires Request parameter")
            
            # Get config
            config = RATE_LIMITS.get(config_name)
            if not config:
                raise ValueError(f"Unknown rate limit config: {config_name}")
            
            # Check rate limit
            limiter = get_rate_limiter()
            allowed, info = limiter.check_rate_limit(request, config)
            
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    headers={
                        "X-RateLimit-Limit": str(info["max_requests"]),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(info["reset_at"]),
                        "Retry-After": str(info["retry_after"])
                    },
                    content={
                        "error": "rate_limit_exceeded",
                        "message": f"Rate limit exceeded. Try again in {info['retry_after']} seconds.",
                        "retry_after": info["retry_after"]
                    }
                )
            
            # Add rate limit headers to response
            response = await func(*args, **kwargs)
            
            # If response is a JSONResponse, add headers
            if hasattr(response, "headers"):
                response.headers["X-RateLimit-Limit"] = str(info["max_requests"])
                response.headers["X-RateLimit-Remaining"] = str(
                    info["max_requests"] - info["current_count"]
                )
                response.headers["X-RateLimit-Reset"] = str(info["reset_at"])
            
            return response
        
        return wrapper
    return decorator


if __name__ == "__main__":
    # Smoke test
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    
    app = FastAPI()
    
    @app.get("/test")
    @rate_limit("strict")  # 10 requests per minute
    async def test_endpoint(request: Request):
        return {"message": "ok"}
    
    client = TestClient(app)
    
    # Should allow first 10 requests
    for i in range(10):
        response = client.get("/test")
        assert response.status_code == 200
    
    # 11th request should be rate limited
    response = client.get("/test")
    assert response.status_code == 429
    assert "retry_after" in response.json()
    
    print("✓ Rate limit smoke test passed")
    print(f"Metrics: {get_rate_limiter().get_metrics()}")
