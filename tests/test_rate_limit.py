#!/usr/bin/env python3
"""
Comprehensive tests for sliding window rate limiter.
Real tests - not theater.
"""

import pytest
import time
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from lib_rate_limit import (
    SlidingWindowRateLimiter,
    RateLimitConfig,
    rate_limit,
    get_rate_limiter,
    RATE_LIMITS
)


class TestSlidingWindowRateLimiter:
    """Test core rate limiter functionality."""
    
    def test_basic_rate_limiting(self):
        """Test that rate limiter blocks after limit reached."""
        limiter = SlidingWindowRateLimiter()
        config = RateLimitConfig(max_requests=5, window_seconds=60)
        
        # Create mock request
        app = FastAPI()
        client = TestClient(app)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"ok": True}
        
        # First 5 requests should pass
        for i in range(5):
            response = client.get("/test")
            allowed, info = limiter.check_rate_limit(response.request, config)
            assert allowed, f"Request {i+1} should be allowed"
        
        # 6th request should be blocked
        response = client.get("/test")
        allowed, info = limiter.check_rate_limit(response.request, config)
        assert not allowed, "Request 6 should be blocked"
        assert info["retry_after"] > 0
    
    def test_sliding_window(self):
        """Test that old requests expire and new requests allowed."""
        limiter = SlidingWindowRateLimiter()
        config = RateLimitConfig(max_requests=3, window_seconds=1.0)  # 1 second window
        
        app = FastAPI()
        client = TestClient(app)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"ok": True}
        
        # Use up limit
        for i in range(3):
            response = client.get("/test")
            allowed, _ = limiter.check_rate_limit(response.request, config)
            assert allowed
        
        # Should be blocked now
        response = client.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        assert not allowed
        
        # Wait for window to slide
        time.sleep(1.1)
        
        # Should be allowed again
        response = client.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        assert allowed
    
    def test_burst_allowance(self):
        """Test burst allowance allows extra requests."""
        limiter = SlidingWindowRateLimiter()
        config = RateLimitConfig(
            max_requests=5,
            window_seconds=60,
            burst_allowance=2
        )
        
        app = FastAPI()
        client = TestClient(app)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"ok": True}
        
        # Should allow 5 + 2 = 7 requests
        for i in range(7):
            response = client.get("/test")
            allowed, _ = limiter.check_rate_limit(response.request, config)
            assert allowed, f"Request {i+1} should be allowed (burst)"
        
        # 8th should be blocked
        response = client.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        assert not allowed
    
    def test_per_client_tracking(self):
        """Test that different clients get separate rate limits."""
        limiter = SlidingWindowRateLimiter()
        config = RateLimitConfig(max_requests=2, window_seconds=60)
        
        app = FastAPI()
        client1 = TestClient(app)
        client2 = TestClient(app)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"ok": True}
        
        # Client 1 uses up limit
        for i in range(2):
            response = client1.get("/test")
            allowed, _ = limiter.check_rate_limit(response.request, config)
            assert allowed
        
        # Client 1 should be blocked
        response = client1.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        assert not allowed
        
        # Client 2 should still be allowed
        response = client2.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        assert allowed
    
    def test_metrics(self):
        """Test that metrics are tracked correctly."""
        limiter = SlidingWindowRateLimiter()
        config = RateLimitConfig(max_requests=2, window_seconds=60)
        
        app = FastAPI()
        client = TestClient(app)
        
        @app.get("/test")
        async def test_endpoint(request: Request):
            return {"ok": True}
        
        # Make some requests
        for i in range(2):
            response = client.get("/test")
            limiter.check_rate_limit(response.request, config)
        
        # Try one more (should be blocked)
        response = client.get("/test")
        limiter.check_rate_limit(response.request, config)
        
        metrics = limiter.get_metrics()
        
        assert metrics["total_requests"] == 2
        assert metrics["total_rate_limited"] == 1
        assert metrics["rate_limited_pct"] > 0


class TestRateLimitDecorator:
    """Test @rate_limit decorator."""
    
    def test_decorator_blocks_requests(self):
        """Test that decorator properly rate limits endpoints."""
        app = FastAPI()
        
        @app.get("/test")
        @rate_limit("strict")  # 10 requests per minute
        async def test_endpoint(request: Request):
            return {"message": "ok"}
        
        client = TestClient(app)
        
        # First 10 should succeed
        for i in range(10):
            response = client.get("/test")
            assert response.status_code == 200, f"Request {i+1} should succeed"
        
        # 11th should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        data = response.json()
        assert "error" in data
        assert data["error"] == "rate_limit_exceeded"
        assert "retry_after" in data
    
    def test_decorator_adds_headers(self):
        """Test that rate limit headers are added to responses."""
        app = FastAPI()
        
        @app.get("/test")
        @rate_limit("strict")
        async def test_endpoint(request: Request):
            return {"message": "ok"}
        
        client = TestClient(app)
        
        response = client.get("/test")
        assert response.status_code == 200
        
        # Check rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
    
    def test_retry_after_header(self):
        """Test that Retry-After header is set on 429 responses."""
        app = FastAPI()
        
        @app.get("/test")
        @rate_limit("strict")
        async def test_endpoint(request: Request):
            return {"message": "ok"}
        
        client = TestClient(app)
        
        # Use up limit
        for i in range(10):
            client.get("/test")
        
        # Get rate limited response
        response = client.get("/test")
        assert response.status_code == 429
        assert "Retry-After" in response.headers
        
        retry_after = int(response.headers["Retry-After"])
        assert retry_after > 0
    
    def test_different_configs(self):
        """Test that different config names apply different limits."""
        app = FastAPI()
        
        @app.get("/strict")
        @rate_limit("strict")  # 10/min
        async def strict_endpoint(request: Request):
            return {"message": "ok"}
        
        @app.get("/moderate")
        @rate_limit("moderate")  # 100/min
        async def moderate_endpoint(request: Request):
            return {"message": "ok"}
        
        client = TestClient(app)
        
        # Strict should block at 11
        for i in range(10):
            response = client.get("/strict")
            assert response.status_code == 200
        
        response = client.get("/strict")
        assert response.status_code == 429
        
        # Moderate should still allow many more
        for i in range(20):
            response = client.get("/moderate")
            assert response.status_code == 200


class TestPredefinedConfigs:
    """Test predefined rate limit configurations."""
    
    def test_all_configs_exist(self):
        """Test that all expected configs are defined."""
        expected = ["strict", "moderate", "permissive", "upload", "read", "write", "chat"]
        for config_name in expected:
            assert config_name in RATE_LIMITS
    
    def test_config_values(self):
        """Test that config values are reasonable."""
        strict = RATE_LIMITS["strict"]
        assert strict.max_requests == 10
        assert strict.window_seconds == 60
        
        upload = RATE_LIMITS["upload"]
        assert upload.burst_allowance == 2  # Should have burst allowance


def test_concurrent_requests():
    """Test rate limiter under concurrent load."""
    import threading
    
    limiter = SlidingWindowRateLimiter()
    config = RateLimitConfig(max_requests=100, window_seconds=60)
    
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"ok": True}
    
    results = {"allowed": 0, "blocked": 0}
    lock = threading.Lock()
    
    def worker():
        client = TestClient(app)
        response = client.get("/test")
        allowed, _ = limiter.check_rate_limit(response.request, config)
        
        with lock:
            if allowed:
                results["allowed"] += 1
            else:
                results["blocked"] += 1
    
    # Spawn 150 concurrent requests (should allow 100, block 50)
    threads = [threading.Thread(target=worker) for _ in range(150)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Should have allowed roughly 100 and blocked roughly 50
    assert results["allowed"] == 100, f"Expected 100 allowed, got {results['allowed']}"
    assert results["blocked"] == 50, f"Expected 50 blocked, got {results['blocked']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
