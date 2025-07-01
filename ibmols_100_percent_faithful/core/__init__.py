"""
IBMOLS 100% C Fidelity Implementation - Core Module

This package provides a complete Python implementation of the IBMOLS algorithm
that achieves 100% fidelity with the original C implementation.

Components:
- exact_c_rng: Exact C random number generator
- c_types_compatibility: C data types and memory layout simulation
- c_memory_manager: C-style memory management
- ibmols_100_percent_faithful: Main IBMOLS algorithm
"""

from .exact_c_rng import ExactCRNG, srand, rand, drand, irand, uniform, RAND_MAX
from .c_types_compatibility import (
    c_int, c_double, c_float, c_char, c_void_p,
    CArray, CMatrix, CStruct,
    np_int32, np_float64, cast_to_c_type,
    NULL, TRUE, FALSE
)
from .c_memory_manager import (
    malloc, calloc, free, realloc,
    check_memory_leaks, cleanup_all_memory, get_memory_stats
)
from .ibmols_100_percent_faithful import IBMOLS, Solution, Population

__version__ = "1.0.0"
__author__ = "IBMOLS C Fidelity Team"

__all__ = [
    # RNG functions
    'ExactCRNG', 'srand', 'rand', 'drand', 'irand', 'uniform', 'RAND_MAX',
    
    # C types
    'c_int', 'c_double', 'c_float', 'c_char', 'c_void_p',
    'CArray', 'CMatrix', 'CStruct',
    'np_int32', 'np_float64', 'cast_to_c_type',
    'NULL', 'TRUE', 'FALSE',
    
    # Memory management
    'malloc', 'calloc', 'free', 'realloc',
    'check_memory_leaks', 'cleanup_all_memory', 'get_memory_stats',
    
    # IBMOLS algorithm
    'IBMOLS', 'Solution', 'Population'
]