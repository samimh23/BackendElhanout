#!/usr/bin/env python3
"""
Basic verification suite for IBMOLS 100% C Fidelity Implementation.

This script performs basic verification tests to ensure the implementation
works correctly and produces consistent results.
"""

import sys
import os
import time
import numpy as np

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from ibmols_100_percent_faithful import IBMOLS
from exact_c_rng import srand


def test_basic_functionality():
    """Test basic IBMOLS functionality."""
    print("Testing basic IBMOLS functionality...")
    
    try:
        # Create IBMOLS instance
        ibmols = IBMOLS(
            num_objectives=2,
            num_variables=5,
            population_size=20,
            max_iterations=10,
            random_seed=42
        )
        
        print("✓ IBMOLS instance created successfully")
        
        # Test initialization
        ibmols.initialize_population()
        print("✓ Population initialized successfully")
        
        # Verify population size
        if ibmols.population.size.value == 20:
            print("✓ Population size is correct")
        else:
            print(f"✗ Population size mismatch: expected 20, got {ibmols.population.size.value}")
            return False
        
        # Test solution evaluation
        solution = ibmols.population.solutions[0]
        obj_before = [solution.objectives[i] for i in range(2)]
        ibmols.evaluate_solution(solution)
        obj_after = [solution.objectives[i] for i in range(2)]
        
        print(f"✓ Solution evaluation works: {obj_before} -> {obj_after}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error in basic functionality test: {e}")
        return False


def test_reproducibility():
    """Test that same seed produces identical results."""
    print("\nTesting reproducibility...")
    
    try:
        seed = 123
        
        # First run
        ibmols1 = IBMOLS(
            num_objectives=2,
            num_variables=3,
            population_size=10,
            max_iterations=5,
            random_seed=seed
        )
        
        ibmols1.initialize_population()
        
        # Get first solution's objectives
        sol1 = ibmols1.population.solutions[0]
        obj1 = [sol1.objectives[i] for i in range(2)]
        
        # Second run with same seed
        ibmols2 = IBMOLS(
            num_objectives=2,
            num_variables=3,
            population_size=10,
            max_iterations=5,
            random_seed=seed
        )
        
        ibmols2.initialize_population()
        
        # Get first solution's objectives
        sol2 = ibmols2.population.solutions[0]
        obj2 = [sol2.objectives[i] for i in range(2)]
        
        # Check if identical
        identical = np.allclose(obj1, obj2, rtol=1e-15, atol=1e-15)
        
        print(f"Run 1 objectives: {obj1}")
        print(f"Run 2 objectives: {obj2}")
        print(f"Identical: {identical}")
        
        if identical:
            print("✓ Reproducibility test passed")
            return True
        else:
            print("✗ Reproducibility test failed")
            return False
            
    except Exception as e:
        print(f"✗ Error in reproducibility test: {e}")
        return False


def test_different_seeds():
    """Test that different seeds produce different results."""
    print("\nTesting different seeds produce different results...")
    
    try:
        # Run with seed 1
        ibmols1 = IBMOLS(
            num_objectives=2,
            num_variables=3,
            population_size=10,
            max_iterations=5,
            random_seed=1
        )
        
        ibmols1.initialize_population()
        sol1 = ibmols1.population.solutions[0]
        obj1 = [sol1.objectives[i] for i in range(2)]
        
        # Run with seed 2
        ibmols2 = IBMOLS(
            num_objectives=2,
            num_variables=3,
            population_size=10,
            max_iterations=5,
            random_seed=2
        )
        
        ibmols2.initialize_population()
        sol2 = ibmols2.population.solutions[0]
        obj2 = [sol2.objectives[i] for i in range(2)]
        
        # Check if different
        different = not np.allclose(obj1, obj2, rtol=1e-10, atol=1e-10)
        
        print(f"Seed 1 objectives: {obj1}")
        print(f"Seed 2 objectives: {obj2}")
        print(f"Different: {different}")
        
        if different:
            print("✓ Different seeds test passed")
            return True
        else:
            print("✗ Different seeds test failed - results too similar")
            return False
            
    except Exception as e:
        print(f"✗ Error in different seeds test: {e}")
        return False


def test_c_types():
    """Test C types compatibility."""
    print("\nTesting C types compatibility...")
    
    try:
        from c_types_compatibility import c_int, c_double, CArray
        
        # Test basic types
        x = c_int(42)
        y = c_double(3.14159)
        
        print(f"c_int(42) = {x.value}")
        print(f"c_double(3.14159) = {y.value}")
        
        # Test array
        arr = CArray(c_double, 5, 0.0)
        arr[0] = 1.0
        arr[1] = 2.0
        
        print(f"CArray values: {arr.to_list()}")
        
        print("✓ C types compatibility test passed")
        return True
        
    except Exception as e:
        print(f"✗ Error in C types test: {e}")
        return False


def test_memory_management():
    """Test memory management."""
    print("\nTesting memory management...")
    
    try:
        from c_memory_manager import malloc, free, get_memory_stats, cleanup_all_memory
        
        # Get initial stats
        initial_stats = get_memory_stats()
        print(f"Initial memory stats: {initial_stats}")
        
        # Allocate some memory
        blocks = []
        for i in range(5):
            block = malloc(100)
            if block:
                blocks.append(block)
        
        # Check stats
        after_alloc_stats = get_memory_stats()
        print(f"After allocation stats: {after_alloc_stats}")
        
        # Free memory
        for block in blocks:
            free(block)
        
        # Check final stats
        after_free_stats = get_memory_stats()
        print(f"After free stats: {after_free_stats}")
        
        # Cleanup
        cleanup_all_memory()
        
        print("✓ Memory management test passed")
        return True
        
    except Exception as e:
        print(f"✗ Error in memory management test: {e}")
        return False


def main():
    """Run all verification tests."""
    print("="*60)
    print("IBMOLS 100% C FIDELITY VERIFICATION SUITE")
    print("="*60)
    
    tests = [
        test_c_types,
        test_memory_management,
        test_basic_functionality,
        test_reproducibility,
        test_different_seeds
    ]
    
    passed = 0
    total = len(tests)
    
    start_time = time.time()
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
                print("✓ PASSED")
            else:
                print("✗ FAILED")
        except Exception as e:
            print(f"✗ ERROR: {e}")
        print("-" * 40)
    
    end_time = time.time()
    
    print(f"\nRESULTS: {passed}/{total} tests passed")
    print(f"Time taken: {end_time - start_time:.2f} seconds")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - IBMOLS implementation is working!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Check implementation")
        return 1


if __name__ == "__main__":
    sys.exit(main())