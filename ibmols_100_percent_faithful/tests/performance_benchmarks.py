#!/usr/bin/env python3
"""
Performance benchmarks for IBMOLS 100% C Fidelity Implementation.

This script measures the performance characteristics of the IBMOLS algorithm
and compares them with expected C-like performance patterns.
"""

import sys
import os
import time
import statistics
import gc

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from ibmols_100_percent_faithful import IBMOLS
from exact_c_rng import srand
from c_memory_manager import get_memory_stats, cleanup_all_memory


def benchmark_initialization(population_sizes, num_runs=5):
    """Benchmark population initialization times."""
    print("Benchmarking population initialization...")
    
    results = {}
    
    for pop_size in population_sizes:
        times = []
        
        for run in range(num_runs):
            # Clean up memory first
            cleanup_all_memory()
            gc.collect()
            
            start_time = time.perf_counter()
            
            ibmols = IBMOLS(
                num_objectives=2,
                num_variables=10,
                population_size=pop_size,
                max_iterations=1,
                random_seed=42
            )
            
            ibmols.initialize_population()
            
            end_time = time.perf_counter()
            times.append(end_time - start_time)
        
        avg_time = statistics.mean(times)
        std_time = statistics.stdev(times) if len(times) > 1 else 0
        
        results[pop_size] = {
            'mean': avg_time,
            'std': std_time,
            'times': times
        }
        
        print(f"Population {pop_size:4d}: {avg_time:.6f}s ± {std_time:.6f}s")
    
    return results


def benchmark_evaluation(num_evaluations_list, num_runs=3):
    """Benchmark solution evaluation times."""
    print("\nBenchmarking solution evaluation...")
    
    results = {}
    
    for num_evals in num_evaluations_list:
        times = []
        
        for run in range(num_runs):
            cleanup_all_memory()
            gc.collect()
            
            ibmols = IBMOLS(
                num_objectives=2,
                num_variables=10,
                population_size=10,
                max_iterations=1,
                random_seed=42
            )
            
            ibmols.initialize_population()
            solution = ibmols.population.solutions[0]
            
            start_time = time.perf_counter()
            
            # Evaluate solution multiple times
            for _ in range(num_evals):
                ibmols.evaluate_solution(solution)
            
            end_time = time.perf_counter()
            total_time = end_time - start_time
            per_eval_time = total_time / num_evals
            
            times.append(per_eval_time)
        
        avg_time = statistics.mean(times)
        std_time = statistics.stdev(times) if len(times) > 1 else 0
        
        results[num_evals] = {
            'mean': avg_time,
            'std': std_time,
            'times': times
        }
        
        print(f"Evaluations {num_evals:6d}: {avg_time:.9f}s/eval ± {std_time:.9f}s")
    
    return results


def benchmark_memory_usage():
    """Benchmark memory usage patterns."""
    print("\nBenchmarking memory usage...")
    
    population_sizes = [10, 50, 100, 200]
    
    for pop_size in population_sizes:
        cleanup_all_memory()
        
        initial_stats = get_memory_stats()
        
        ibmols = IBMOLS(
            num_objectives=2,
            num_variables=10,
            population_size=pop_size,
            max_iterations=1,
            random_seed=42
        )
        
        ibmols.initialize_population()
        
        after_init_stats = get_memory_stats()
        
        print(f"Population {pop_size:3d}: "
              f"Initial: {initial_stats['allocated_blocks']} blocks, "
              f"After init: {after_init_stats['allocated_blocks']} blocks, "
              f"Memory: {after_init_stats['total_bytes']} bytes")


def benchmark_rng_performance():
    """Benchmark random number generator performance."""
    print("\nBenchmarking RNG performance...")
    
    from exact_c_rng import ExactCRNG, rand, drand
    
    num_generations = [1000, 10000, 100000]
    
    for num_gen in num_generations:
        # Test instance-based RNG
        rng = ExactCRNG(42)
        
        start_time = time.perf_counter()
        for _ in range(num_gen):
            rng.rand()
        end_time = time.perf_counter()
        
        instance_time = end_time - start_time
        
        # Test global RNG
        srand(42)
        
        start_time = time.perf_counter()
        for _ in range(num_gen):
            rand()
        end_time = time.perf_counter()
        
        global_time = end_time - start_time
        
        print(f"RNG {num_gen:6d} calls: "
              f"Instance: {instance_time:.6f}s ({num_gen/instance_time:,.0f} calls/s), "
              f"Global: {global_time:.6f}s ({num_gen/global_time:,.0f} calls/s)")


def benchmark_algorithm_scaling():
    """Benchmark algorithm scaling with problem size."""
    print("\nBenchmarking algorithm scaling...")
    
    # Test different problem sizes
    test_configs = [
        (2, 5, 20),   # Small problem
        (2, 10, 50),  # Medium problem  
        (3, 15, 100), # Large problem
    ]
    
    for num_obj, num_var, pop_size in test_configs:
        times = []
        
        for run in range(3):
            cleanup_all_memory()
            gc.collect()
            
            start_time = time.perf_counter()
            
            ibmols = IBMOLS(
                num_objectives=num_obj,
                num_variables=num_var,
                population_size=pop_size,
                max_iterations=5,
                random_seed=42
            )
            
            # Run a few iterations
            ibmols.initialize_population()
            
            # Simplified evolution for benchmarking
            for _ in range(5):
                ibmols.block_based_evolution()
                ibmols.environmental_selection()
            
            end_time = time.perf_counter()
            times.append(end_time - start_time)
        
        avg_time = statistics.mean(times)
        std_time = statistics.stdev(times) if len(times) > 1 else 0
        
        print(f"Problem (obj={num_obj}, var={num_var}, pop={pop_size}): "
              f"{avg_time:.6f}s ± {std_time:.6f}s")


def benchmark_reproducibility_performance():
    """Benchmark the performance cost of reproducibility."""
    print("\nBenchmarking reproducibility performance...")
    
    num_runs = 5
    pop_size = 100
    iterations = 10
    
    # Test with different seeds but same algorithm
    times = []
    
    for run in range(num_runs):
        cleanup_all_memory()
        gc.collect()
        
        start_time = time.perf_counter()
        
        ibmols = IBMOLS(
            num_objectives=2,
            num_variables=10,
            population_size=pop_size,
            max_iterations=iterations,
            random_seed=run + 1  # Different seed each time
        )
        
        ibmols.initialize_population()
        
        # Run evolution
        for _ in range(iterations):
            ibmols.block_based_evolution()
            ibmols.environmental_selection()
        
        end_time = time.perf_counter()
        times.append(end_time - start_time)
    
    avg_time = statistics.mean(times)
    std_time = statistics.stdev(times)
    cv = (std_time / avg_time) * 100  # Coefficient of variation
    
    print(f"Reproducibility test ({num_runs} runs): "
          f"{avg_time:.6f}s ± {std_time:.6f}s (CV: {cv:.2f}%)")
    
    if cv < 5.0:  # Less than 5% variation
        print("✓ Performance is highly consistent across different seeds")
    elif cv < 10.0:
        print("⚠ Performance has moderate variation across seeds")
    else:
        print("✗ Performance has high variation across seeds")


def main():
    """Run all performance benchmarks."""
    print("="*60)
    print("IBMOLS 100% C FIDELITY PERFORMANCE BENCHMARKS")
    print("="*60)
    
    start_time = time.time()
    
    # Run benchmarks
    benchmark_initialization([10, 25, 50, 100, 200])
    benchmark_evaluation([100, 1000, 10000])
    benchmark_memory_usage()
    benchmark_rng_performance()
    benchmark_algorithm_scaling()
    benchmark_reproducibility_performance()
    
    end_time = time.time()
    
    print("\n" + "="*60)
    print(f"Total benchmark time: {end_time - start_time:.2f} seconds")
    
    # Final memory check
    final_stats = get_memory_stats()
    if final_stats['allocated_blocks'] > 0:
        print(f"⚠ Memory leak detected: {final_stats['allocated_blocks']} blocks not freed")
    else:
        print("✓ No memory leaks detected")
    
    print("✓ Performance benchmarks completed successfully")


if __name__ == "__main__":
    main()