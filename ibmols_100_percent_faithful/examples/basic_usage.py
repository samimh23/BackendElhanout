#!/usr/bin/env python3
"""
Basic usage examples for IBMOLS 100% C Fidelity Implementation.

This script demonstrates how to use the IBMOLS algorithm for different
multi-objective optimization problems.
"""

import sys
import os
import numpy as np
import time

# Add the core module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'core'))

from ibmols_100_percent_faithful import IBMOLS
from exact_c_rng import srand


def example_zdt1():
    """Example using ZDT1 test problem."""
    print("Example 1: ZDT1 Test Problem")
    print("-" * 40)
    
    def zdt1_function(variables):
        """ZDT1 test function."""
        x = variables
        n = len(x)
        
        f1 = x[0]
        
        g = 1.0 + 9.0 * sum(x[1:]) / (n - 1) if n > 1 else 1.0
        h = 1.0 - np.sqrt(f1 / g)
        f2 = g * h
        
        return [f1, f2]
    
    # Create IBMOLS instance
    ibmols = IBMOLS(
        num_objectives=2,
        num_variables=10,
        population_size=50,
        max_iterations=100,
        problem_function=zdt1_function,
        random_seed=42
    )
    
    print(f"Problem: ZDT1 with {ibmols.num_variables.value} variables")
    print(f"Population size: {ibmols.population_size.value}")
    print(f"Max iterations: {ibmols.max_iterations.value}")
    
    start_time = time.time()
    
    # Run the algorithm
    pareto_front = ibmols.run()
    
    end_time = time.time()
    
    print(f"\nAlgorithm completed in {end_time - start_time:.2f} seconds")
    print(f"Pareto front size: {len(pareto_front)}")
    print(f"Function evaluations: {ibmols.evaluations.value}")
    
    # Display first few solutions
    print("\nFirst 5 Pareto optimal solutions:")
    for i, (objectives, variables) in enumerate(pareto_front[:5]):
        print(f"Solution {i+1}: f1={objectives[0]:.6f}, f2={objectives[1]:.6f}")
    
    return pareto_front


def example_dtlz2():
    """Example using DTLZ2 test problem."""
    print("\nExample 2: DTLZ2 Test Problem (3 objectives)")
    print("-" * 40)
    
    def dtlz2_function(variables):
        """DTLZ2 test function with 3 objectives."""
        x = variables
        n = len(x)
        k = n - 3 + 1  # For 3 objectives
        
        # Calculate g
        g = sum((x[i] - 0.5)**2 for i in range(n - k, n))
        
        # Calculate objectives
        f1 = (1 + g) * np.cos(x[0] * np.pi / 2) * np.cos(x[1] * np.pi / 2)
        f2 = (1 + g) * np.cos(x[0] * np.pi / 2) * np.sin(x[1] * np.pi / 2)
        f3 = (1 + g) * np.sin(x[0] * np.pi / 2)
        
        return [f1, f2, f3]
    
    # Create IBMOLS instance for 3-objective problem
    ibmols = IBMOLS(
        num_objectives=3,
        num_variables=12,
        population_size=100,
        max_iterations=50,
        problem_function=dtlz2_function,
        random_seed=123
    )
    
    print(f"Problem: DTLZ2 with {ibmols.num_objectives.value} objectives, {ibmols.num_variables.value} variables")
    print(f"Population size: {ibmols.population_size.value}")
    
    start_time = time.time()
    
    # Run the algorithm
    pareto_front = ibmols.run()
    
    end_time = time.time()
    
    print(f"\nAlgorithm completed in {end_time - start_time:.2f} seconds")
    print(f"Pareto front size: {len(pareto_front)}")
    print(f"Function evaluations: {ibmols.evaluations.value}")
    
    # Display first few solutions
    print("\nFirst 3 Pareto optimal solutions:")
    for i, (objectives, variables) in enumerate(pareto_front[:3]):
        print(f"Solution {i+1}: f1={objectives[0]:.4f}, f2={objectives[1]:.4f}, f3={objectives[2]:.4f}")
    
    return pareto_front


def example_custom_problem():
    """Example with a custom engineering problem."""
    print("\nExample 3: Custom Engineering Problem")
    print("-" * 40)
    
    def engineering_function(variables):
        """
        Custom engineering optimization problem:
        - Minimize cost and weight
        - Variables represent design parameters
        """
        x1, x2, x3 = variables[0], variables[1], variables[2]
        
        # Objective 1: Cost (to minimize)
        cost = 10 * x1**2 + 5 * x2**2 + 3 * x3**2 + 2 * x1 * x2
        
        # Objective 2: Weight (to minimize)  
        weight = 2 * x1 + 3 * x2 + x3 + np.sin(x1 * np.pi) + np.cos(x2 * np.pi)
        
        return [cost, weight]
    
    # Create IBMOLS instance
    ibmols = IBMOLS(
        num_objectives=2,
        num_variables=3,
        population_size=30,
        max_iterations=75,
        problem_function=engineering_function,
        random_seed=456
    )
    
    print(f"Problem: Custom engineering problem")
    print(f"Objectives: Cost, Weight (both to minimize)")
    print(f"Variables: 3 design parameters")
    
    start_time = time.time()
    
    # Run the algorithm
    pareto_front = ibmols.run()
    
    end_time = time.time()
    
    print(f"\nAlgorithm completed in {end_time - start_time:.2f} seconds")
    print(f"Pareto front size: {len(pareto_front)}")
    print(f"Function evaluations: {ibmols.evaluations.value}")
    
    # Find extreme solutions
    if pareto_front:
        min_cost_sol = min(pareto_front, key=lambda s: s[0][0])
        min_weight_sol = min(pareto_front, key=lambda s: s[0][1])
        
        print(f"\nBest cost solution: Cost={min_cost_sol[0][0]:.4f}, Weight={min_cost_sol[0][1]:.4f}")
        print(f"Variables: {[f'{v:.4f}' for v in min_cost_sol[1]]}")
        
        print(f"\nBest weight solution: Cost={min_weight_sol[0][0]:.4f}, Weight={min_weight_sol[0][1]:.4f}")
        print(f"Variables: {[f'{v:.4f}' for v in min_weight_sol[1]]}")
    
    return pareto_front


def example_reproducibility():
    """Example demonstrating reproducibility."""
    print("\nExample 4: Reproducibility Demonstration")
    print("-" * 40)
    
    def simple_function(variables):
        """Simple test function."""
        x, y = variables[0], variables[1]
        f1 = x**2 + y**2
        f2 = (x - 1)**2 + (y - 1)**2
        return [f1, f2]
    
    seed = 789
    
    # First run
    print("First run...")
    ibmols1 = IBMOLS(
        num_objectives=2,
        num_variables=2,
        population_size=20,
        max_iterations=10,
        problem_function=simple_function,
        random_seed=seed
    )
    
    pareto_front1 = ibmols1.run()
    
    # Second run with same seed
    print("Second run with same seed...")
    ibmols2 = IBMOLS(
        num_objectives=2,
        num_variables=2,
        population_size=20,
        max_iterations=10,
        problem_function=simple_function,
        random_seed=seed
    )
    
    pareto_front2 = ibmols2.run()
    
    # Check reproducibility
    print(f"\nReproducibility check:")
    print(f"Run 1: {len(pareto_front1)} solutions, {ibmols1.evaluations.value} evaluations")
    print(f"Run 2: {len(pareto_front2)} solutions, {ibmols2.evaluations.value} evaluations")
    
    # Compare first solutions
    if pareto_front1 and pareto_front2:
        sol1 = pareto_front1[0]
        sol2 = pareto_front2[0]
        
        obj_identical = np.allclose(sol1[0], sol2[0], rtol=1e-15, atol=1e-15)
        var_identical = np.allclose(sol1[1], sol2[1], rtol=1e-15, atol=1e-15)
        
        print(f"First solution objectives identical: {obj_identical}")
        print(f"First solution variables identical: {var_identical}")
        
        if obj_identical and var_identical:
            print("✓ Perfect reproducibility achieved!")
        else:
            print("✗ Reproducibility issue detected")
    
    return pareto_front1, pareto_front2


def example_parameter_study():
    """Example showing parameter sensitivity."""
    print("\nExample 5: Parameter Study")
    print("-" * 40)
    
    def test_function(variables):
        """Simple test function for parameter study."""
        x = variables[0]
        f1 = x**2
        f2 = (x - 2)**2
        return [f1, f2]
    
    # Test different population sizes
    population_sizes = [10, 20, 50]
    
    print("Testing different population sizes:")
    
    for pop_size in population_sizes:
        ibmols = IBMOLS(
            num_objectives=2,
            num_variables=1,
            population_size=pop_size,
            max_iterations=20,
            problem_function=test_function,
            random_seed=42
        )
        
        start_time = time.time()
        pareto_front = ibmols.run()
        end_time = time.time()
        
        print(f"Pop size {pop_size:2d}: {len(pareto_front):2d} solutions, "
              f"{ibmols.evaluations.value:3d} evaluations, "
              f"{end_time - start_time:.3f}s")


def main():
    """Run all examples."""
    print("="*60)
    print("IBMOLS 100% C FIDELITY - BASIC USAGE EXAMPLES")
    print("="*60)
    
    try:
        # Run examples
        example_zdt1()
        example_dtlz2()
        example_custom_problem()
        example_reproducibility()
        example_parameter_study()
        
        print("\n" + "="*60)
        print("✓ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Error running examples: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())