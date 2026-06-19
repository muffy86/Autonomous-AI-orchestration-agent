#!/usr/bin/env python3
"""
Cache benchmark - NO THEATER, REAL MEASUREMENTS
Compares cached vs uncached performance for 1000 requests.
"""

import time
import random
import json
from typing import List, Dict
from lib_cache import ProductionCache, cached


def simulate_expensive_operation(item_id: int) -> dict:
    """Simulate an expensive database/API call."""
    time.sleep(0.001)  # 1ms delay
    return {
        "id": item_id,
        "data": "x" * 1000,  # 1KB payload
        "timestamp": time.time()
    }


def benchmark_uncached(num_requests: int = 1000) -> Dict[str, float]:
    """Benchmark without caching."""
    start = time.time()
    
    results = []
    for i in range(num_requests):
        # Repeat some IDs to simulate repeated queries
        item_id = random.randint(0, num_requests // 10)
        result = simulate_expensive_operation(item_id)
        results.append(result)
    
    elapsed = time.time() - start
    
    return {
        "total_time_sec": elapsed,
        "requests_per_sec": num_requests / elapsed,
        "avg_latency_ms": (elapsed / num_requests) * 1000,
        "total_requests": num_requests
    }


def benchmark_cached(num_requests: int = 1000) -> Dict[str, float]:
    """Benchmark with caching."""
    cache = ProductionCache(max_size_bytes=10 * 1024 * 1024)  # 10MB
    
    @cached(ttl=60.0, cache_instance=cache)
    def cached_operation(item_id: int) -> dict:
        return simulate_expensive_operation(item_id)
    
    start = time.time()
    
    results = []
    for i in range(num_requests):
        # Repeat some IDs to simulate repeated queries (should hit cache)
        item_id = random.randint(0, num_requests // 10)
        result = cached_operation(item_id)
        results.append(result)
    
    elapsed = time.time() - start
    metrics = cache.get_metrics()
    
    return {
        "total_time_sec": elapsed,
        "requests_per_sec": num_requests / elapsed,
        "avg_latency_ms": (elapsed / num_requests) * 1000,
        "total_requests": num_requests,
        "cache_hits": metrics['hits'],
        "cache_misses": metrics['misses'],
        "hit_rate": metrics['hit_rate'],
        "memory_bytes": metrics['total_bytes']
    }


def run_benchmark(num_requests: int = 1000, num_runs: int = 3) -> None:
    """Run benchmark multiple times and average results."""
    print(f"\n{'='*60}")
    print(f"Cache Benchmark - {num_requests} requests x {num_runs} runs")
    print(f"{'='*60}\n")
    
    # Warm up
    benchmark_uncached(100)
    benchmark_cached(100)
    
    # Run uncached benchmarks
    print("Running uncached benchmarks...")
    uncached_results = []
    for i in range(num_runs):
        result = benchmark_uncached(num_requests)
        uncached_results.append(result)
        print(f"  Run {i+1}: {result['total_time_sec']:.3f}s, "
              f"{result['requests_per_sec']:.1f} req/s")
    
    # Run cached benchmarks
    print("\nRunning cached benchmarks...")
    cached_results = []
    for i in range(num_runs):
        result = benchmark_cached(num_requests)
        cached_results.append(result)
        print(f"  Run {i+1}: {result['total_time_sec']:.3f}s, "
              f"{result['requests_per_sec']:.1f} req/s, "
              f"hit_rate={result['hit_rate']:.1%}")
    
    # Calculate averages
    avg_uncached_time = sum(r['total_time_sec'] for r in uncached_results) / num_runs
    avg_cached_time = sum(r['total_time_sec'] for r in cached_results) / num_runs
    avg_hit_rate = sum(r['hit_rate'] for r in cached_results) / num_runs
    
    speedup = avg_uncached_time / avg_cached_time if avg_cached_time > 0 else 0
    time_saved = avg_uncached_time - avg_cached_time
    time_saved_pct = (time_saved / avg_uncached_time * 100) if avg_uncached_time > 0 else 0
    
    # Print results
    print(f"\n{'='*60}")
    print("RESULTS (averaged over", num_runs, "runs)")
    print(f"{'='*60}")
    print(f"Uncached: {avg_uncached_time:.3f}s")
    print(f"Cached:   {avg_cached_time:.3f}s")
    print(f"Speedup:  {speedup:.2f}x")
    print(f"Time saved: {time_saved:.3f}s ({time_saved_pct:.1f}%)")
    print(f"Avg cache hit rate: {avg_hit_rate:.1%}")
    print(f"{'='*60}\n")
    
    # Verify we got real speedup
    if speedup < 1.5:
        print("⚠️  WARNING: Speedup less than 1.5x - check configuration")
    else:
        print(f"✓ Cache working - {speedup:.2f}x faster than uncached")
    
    # Save benchmark results
    results = {
        "timestamp": time.time(),
        "num_requests": num_requests,
        "num_runs": num_runs,
        "uncached": {
            "avg_time_sec": avg_uncached_time,
            "runs": uncached_results
        },
        "cached": {
            "avg_time_sec": avg_cached_time,
            "avg_hit_rate": avg_hit_rate,
            "runs": cached_results
        },
        "speedup": speedup,
        "time_saved_sec": time_saved,
        "time_saved_pct": time_saved_pct
    }
    
    with open("benchmarks/cache_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print("Benchmark results saved to: benchmarks/cache_results.json")


if __name__ == "__main__":
    import sys
    import os
    
    # Create benchmarks directory
    os.makedirs("benchmarks", exist_ok=True)
    
    # Parse args
    num_requests = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    num_runs = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    
    run_benchmark(num_requests, num_runs)
