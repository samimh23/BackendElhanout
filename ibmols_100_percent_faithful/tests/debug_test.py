#!/usr/bin/env python3
"""
Simple debug test for IBMOLS.
"""

import sys
import os

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from ibmols_100_percent_faithful import IBMOLS


def simple_test():
    """Simple test to debug the issue."""
    print("Creating IBMOLS instance...")
    
    def test_function(variables):
        x = variables[0]
        return [x**2, (x-1)**2]
    
    ibmols = IBMOLS(
        num_objectives=2,
        num_variables=1,
        population_size=5,
        max_iterations=2,
        problem_function=test_function,
        random_seed=42
    )
    
    print("Initializing population...")
    ibmols.initialize_population()
    
    print("Checking solution attributes...")
    for i, sol in enumerate(ibmols.population.solutions):
        print(f"Solution {i}:")
        print(f"  rank type: {type(sol.rank)}")
        print(f"  rank value: {sol.rank}")
        print(f"  crowding_distance type: {type(sol.crowding_distance)}")
        print(f"  crowding_distance value: {sol.crowding_distance}")
    
    print("Testing selection...")
    try:
        idx = ibmols.selection()
        print(f"Selection successful: {idx}")
    except Exception as e:
        print(f"Selection failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    simple_test()