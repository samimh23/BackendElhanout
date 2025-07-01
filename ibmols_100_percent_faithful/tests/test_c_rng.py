#!/usr/bin/env python3
"""
Test script for exact C random number generator.

This script verifies that our Python implementation produces
identical results to the C rand() function.
"""

import sys
import os

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from exact_c_rng import ExactCRNG, srand, rand, RAND_MAX


def test_known_sequence():
    """Test against known C rand() sequence."""
    print("Testing known C rand() sequence...")
    
    # Known sequence for seed 1 (verified against actual C implementation)
    rng = ExactCRNG(1)
    
    expected_values = [
        1804289383, 846930886, 1681692777, 1714636915, 1957747793,
        424238335, 719885386, 1649760492, 596516649, 1189641421
    ]
    
    success = True
    for i, expected in enumerate(expected_values):
        actual = rng.rand()
        if actual != expected:
            print(f"FAIL: Index {i}, expected {expected}, got {actual}")
            success = False
        else:
            print(f"PASS: Index {i}, value {actual}")
    
    return success


def test_global_functions():
    """Test global functions match instance methods."""
    print("\nTesting global functions...")
    
    # Test with seed 42
    seed_val = 42
    
    # Instance version
    rng = ExactCRNG(seed_val)
    instance_values = [rng.rand() for _ in range(5)]
    
    # Global version
    srand(seed_val)
    global_values = [rand() for _ in range(5)]
    
    success = instance_values == global_values
    print(f"Instance values: {instance_values}")
    print(f"Global values:   {global_values}")
    print(f"Match: {success}")
    
    return success


def test_rand_max():
    """Test RAND_MAX constant."""
    print(f"\nTesting RAND_MAX...")
    print(f"RAND_MAX = {RAND_MAX}")
    
    # Generate many values and ensure none exceed RAND_MAX
    rng = ExactCRNG(123)
    max_seen = 0
    for _ in range(1000):
        val = rng.rand()
        if val > RAND_MAX:
            print(f"FAIL: Value {val} exceeds RAND_MAX {RAND_MAX}")
            return False
        max_seen = max(max_seen, val)
    
    print(f"Largest value seen: {max_seen}")
    print(f"Within bounds: {max_seen <= RAND_MAX}")
    return True


def test_drand():
    """Test drand() function."""
    print(f"\nTesting drand()...")
    
    rng = ExactCRNG(456)
    values = [rng.drand() for _ in range(10)]
    
    all_in_range = all(0.0 <= v < 1.0 for v in values)
    print(f"Generated values: {values[:5]}...")
    print(f"All in range [0.0, 1.0): {all_in_range}")
    
    return all_in_range


def test_reproducibility():
    """Test that same seed produces identical sequences."""
    print(f"\nTesting reproducibility...")
    
    seed_val = 789
    
    # First sequence
    rng1 = ExactCRNG(seed_val)
    seq1 = [rng1.rand() for _ in range(20)]
    
    # Second sequence with same seed
    rng2 = ExactCRNG(seed_val)
    seq2 = [rng2.rand() for _ in range(20)]
    
    identical = seq1 == seq2
    print(f"Sequences identical: {identical}")
    if not identical:
        print(f"Seq1: {seq1[:5]}...")
        print(f"Seq2: {seq2[:5]}...")
    
    return identical


def main():
    """Run all tests."""
    print("="*60)
    print("EXACT C RNG VERIFICATION TESTS")
    print("="*60)
    
    tests = [
        test_known_sequence,
        test_global_functions,
        test_rand_max,
        test_drand,
        test_reproducibility
    ]
    
    passed = 0
    total = len(tests)
    
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
    
    print(f"\nRESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - C RNG implementation is correct!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Check implementation")
        return 1


if __name__ == "__main__":
    sys.exit(main())