#!/usr/bin/env python3
"""
Quick test of basic IBMOLS usage.
"""

import sys
import os

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from ibmols_100_percent_faithful import IBMOLS


def quick_test():
    """Quick functionality test."""
    print("Quick IBMOLS test...")
    
    def test_function(variables):
        x = variables[0]
        return [x**2, (x-1)**2]
    
    ibmols = IBMOLS(
        num_objectives=2,
        num_variables=1,
        population_size=10,
        max_iterations=5,
        problem_function=test_function,
        random_seed=42
    )
    
    print("Running algorithm...")
    pareto_front = ibmols.run()
    
    print(f"Completed! Found {len(pareto_front)} solutions")
    print(f"Function evaluations: {ibmols.evaluations.value}")
    
    if pareto_front:
        print("First solution:")
        print(f"  Objectives: {pareto_front[0][0]}")
        print(f"  Variables: {pareto_front[0][1]}")
    
    print("✓ Quick test successful!")


if __name__ == "__main__":
    quick_test()