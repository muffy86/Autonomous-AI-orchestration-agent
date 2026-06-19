#!/usr/bin/env python3
"""
Unit tests for production cache - real tests, not theater.
"""

import pytest
import time
import json
from lib_cache import ProductionCache, cached, CacheEntry


class TestCacheEntry:
    """Test CacheEntry functionality."""
    
    def test_expiration(self):
        """Test TTL expiration."""
        entry = CacheEntry(
            key="test",
            value="data",
            created_at=time.time() - 10,  # 10 seconds ago
            ttl=5.0,  # 5 second TTL
            size_bytes=100
        )
        assert entry.is_expired is True
        
        entry2 = CacheEntry(
            key="test2",
            value="data2",
            created_at=time.time(),
            ttl=10.0,
            size_bytes=100
        )
        assert entry2.is_expired is False
    
    def test_size_estimation(self):
        """Test memory size estimation."""
        entry = CacheEntry(
            key="test",
            value={"data": "x" * 1000},  # ~1KB
            created_at=time.time(),
            ttl=60.0,
            size_bytes=0
        )
        size = entry.estimate_size(entry.value)
        assert size > 1000  # Should be at least 1KB
        assert size < 2000  # Should be less than 2KB


class TestProductionCache:
    """Test ProductionCache functionality."""
    
    def test_basic_get_set(self):
        """Test basic get/set operations."""
        cache = ProductionCache()
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        assert cache.get("nonexistent") is None
    
    def test_ttl_expiration(self):
        """Test that expired entries return None."""
        cache = ProductionCache()
        
        cache.set("key1", "value1", ttl=0.1)  # 100ms TTL
        assert cache.get("key1") == "value1"
        
        time.sleep(0.15)  # Wait for expiration
        assert cache.get("key1") is None
    
    def test_metrics_tracking(self):
        """Test metrics are tracked correctly."""
        cache = ProductionCache()
        
        # Initial state
        assert cache.metrics.hits == 0
        assert cache.metrics.misses == 0
        
        # Set and hit
        cache.set("key1", "value1")
        cache.get("key1")
        assert cache.metrics.hits == 1
        assert cache.metrics.misses == 0
        
        # Miss
        cache.get("nonexistent")
        assert cache.metrics.hits == 1
        assert cache.metrics.misses == 1
        
        # Hit rate
        assert cache.metrics.hit_rate == 0.5
    
    def test_lru_eviction(self):
        """Test LRU eviction when memory limit reached."""
        cache = ProductionCache(max_size_bytes=2500)  # 2.5KB limit for overhead
        
        # Add 3 entries of ~1KB each
        cache.set("key1", "x" * 1000)
        cache.set("key2", "y" * 1000)
        cache.set("key3", "z" * 1000)  # Should evict key1
        
        # key1 should be evicted (oldest)
        assert cache.get("key1") is None
        assert cache.get("key2") is not None
        assert cache.get("key3") is not None
        
        # Check evictions metric
        assert cache.metrics.evictions > 0
    
    def test_lru_access_order(self):
        """Test that accessing an entry updates LRU order."""
        cache = ProductionCache(max_size_bytes=2500)  # 2.5KB limit
        
        cache.set("key1", "x" * 1000)
        cache.set("key2", "y" * 1000)
        
        # Access key1 to make it most recent
        cache.get("key1")
        
        # Add key3, should evict key2 (least recent)
        cache.set("key3", "z" * 1000)
        
        assert cache.get("key1") is not None  # Should still exist
        assert cache.get("key2") is None       # Should be evicted
        assert cache.get("key3") is not None
    
    def test_delete(self):
        """Test delete operation."""
        cache = ProductionCache()
        
        cache.set("key1", "value1")
        assert cache.delete("key1") is True
        assert cache.get("key1") is None
        assert cache.delete("key1") is False  # Already deleted
    
    def test_clear(self):
        """Test clear operation."""
        cache = ProductionCache()
        
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        
        cache.clear()
        
        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.metrics.total_bytes == 0
    
    def test_invalidate_pattern(self):
        """Test pattern-based invalidation."""
        cache = ProductionCache()
        
        cache.set("user:123:profile", {"name": "Alice"})
        cache.set("user:123:settings", {"theme": "dark"})
        cache.set("user:456:profile", {"name": "Bob"})
        
        # Invalidate all keys for user:123
        count = cache.invalidate_pattern("user:123")
        assert count == 2
        
        assert cache.get("user:123:profile") is None
        assert cache.get("user:123:settings") is None
        assert cache.get("user:456:profile") is not None
    
    def test_get_metrics(self):
        """Test metrics retrieval."""
        cache = ProductionCache(max_size_bytes=10000)
        
        cache.set("key1", "value1")
        cache.get("key1")
        cache.get("nonexistent")
        
        metrics = cache.get_metrics()
        
        assert "hits" in metrics
        assert "misses" in metrics
        assert "hit_rate" in metrics
        assert "entries" in metrics
        assert "total_bytes" in metrics
        assert "memory_usage_pct" in metrics
        
        assert metrics["entries"] == 1
        assert metrics["hits"] == 1
        assert metrics["misses"] == 1


class TestCachedDecorator:
    """Test @cached decorator."""
    
    def test_basic_caching(self):
        """Test that decorator caches function results."""
        call_count = 0
        
        @cached(ttl=60.0, key_prefix="test")
        def expensive_func(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call - should execute function
        result1 = expensive_func(5)
        assert result1 == 10
        assert call_count == 1
        
        # Second call - should use cache
        result2 = expensive_func(5)
        assert result2 == 10
        assert call_count == 1  # Function not called again
        
        # Different argument - should execute function
        result3 = expensive_func(10)
        assert result3 == 20
        assert call_count == 2
    
    def test_ttl_expiration(self):
        """Test that cached results expire after TTL."""
        call_count = 0
        
        @cached(ttl=0.1, key_prefix="test")  # 100ms TTL
        def func(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2
        
        func(5)
        assert call_count == 1
        
        time.sleep(0.15)  # Wait for expiration
        
        func(5)
        assert call_count == 2  # Should call function again
    
    def test_kwargs_caching(self):
        """Test that kwargs are included in cache key."""
        call_count = 0
        
        @cached(ttl=60.0, key_prefix="test")
        def func(x: int, y: int = 10) -> int:
            nonlocal call_count
            call_count += 1
            return x + y
        
        func(5, y=10)
        assert call_count == 1
        
        func(5, y=10)
        assert call_count == 1  # Same args, should use cache
        
        func(5, y=20)
        assert call_count == 2  # Different kwarg, should call function


def test_thread_safety():
    """Test that cache is thread-safe."""
    import threading
    
    cache = ProductionCache()
    results = []
    
    def worker():
        for i in range(100):
            cache.set(f"key{i % 10}", f"value{i}")
            value = cache.get(f"key{i % 10}")
            results.append(value)
    
    threads = [threading.Thread(target=worker) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Should not crash and should have results
    assert len(results) > 0
    
    # Metrics should be consistent
    metrics = cache.get_metrics()
    assert metrics['total_requests'] == len(results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
