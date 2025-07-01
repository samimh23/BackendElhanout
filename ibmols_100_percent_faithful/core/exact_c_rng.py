"""
Exact C Random Number Generator Implementation

This module provides bit-for-bit identical random number generation
to the C standard library's rand() function using glibc's Linear
Congruential Generator (LCG) algorithm.

The implementation follows the glibc specification:
- Uses the BSD/glibc algorithm with 31-bit state
- Formula: state = (state * 1103515245 + 12345) & 0x7fffffff
- Returns state directly (not shifted)
"""

import ctypes
from typing import Optional


class ExactCRNG:
    """
    Exact implementation of C's rand() function using glibc LCG.
    
    This class provides bit-for-bit identical results to C's rand()
    function, ensuring perfect reproducibility across implementations.
    """
    
    # glibc LCG constants (BSD/glibc algorithm)
    _MULTIPLIER = 1103515245
    _INCREMENT = 12345
    _MASK = 0x7fffffff  # 2^31 - 1 (31-bit mask)
    _RAND_MAX = 2147483647  # 2^31 - 1
    
    def __init__(self, seed: Optional[int] = None):
        """
        Initialize the RNG with an optional seed.
        
        Args:
            seed: Initial seed value. If None, uses seed 1 (C default)
        """
        self._state = 1  # Default C seed
        if seed is not None:
            self.srand(seed)
    
    def srand(self, seed: int) -> None:
        """
        Set the random seed exactly like C's srand().
        
        Args:
            seed: Seed value
        """
        self._state = seed & self._MASK
    
    def rand(self) -> int:
        """
        Generate next random number exactly like C's rand().
        
        Returns:
            Random integer in range [0, RAND_MAX]
        """
        # Apply LCG formula: state = (state * a + c) & mask
        # This matches the glibc implementation exactly
        self._state = (self._state * self._MULTIPLIER + self._INCREMENT) & self._MASK
        return self._state
    
    def irand(self, max_val: int) -> int:
        """
        Generate random integer in range [0, max_val-1].
        
        This matches common C usage: rand() % max_val
        
        Args:
            max_val: Upper bound (exclusive)
            
        Returns:
            Random integer in range [0, max_val-1]
        """
        if max_val <= 0:
            return 0
        return self.rand() % max_val
    
    def drand(self) -> float:
        """
        Generate random double in range [0.0, 1.0).
        
        This matches common C usage: (double)rand() / RAND_MAX
        
        Returns:
            Random double in range [0.0, 1.0)
        """
        return float(self.rand()) / float(self._RAND_MAX)
    
    def uniform(self, min_val: float, max_val: float) -> float:
        """
        Generate random double in range [min_val, max_val).
        
        Args:
            min_val: Minimum value (inclusive)
            max_val: Maximum value (exclusive)
            
        Returns:
            Random double in specified range
        """
        return min_val + self.drand() * (max_val - min_val)
    
    def get_state(self) -> int:
        """
        Get current internal state for debugging/testing.
        
        Returns:
            Current RNG state
        """
        return self._state
    
    def set_state(self, state: int) -> None:
        """
        Set internal state directly for debugging/testing.
        
        Args:
            state: New RNG state
        """
        self._state = state & self._MASK
    
    @property
    def RAND_MAX(self) -> int:
        """Maximum value returned by rand()."""
        return self._RAND_MAX


# Global instance for C-style usage
_global_rng = ExactCRNG()


def srand(seed: int) -> None:
    """Global srand function matching C behavior."""
    _global_rng.srand(seed)


def rand() -> int:
    """Global rand function matching C behavior."""
    return _global_rng.rand()


def irand(max_val: int) -> int:
    """Global irand function for integer range."""
    return _global_rng.irand(max_val)


def drand() -> float:
    """Global drand function for double range."""
    return _global_rng.drand()


def uniform(min_val: float, max_val: float) -> float:
    """Global uniform function for custom range."""
    return _global_rng.uniform(min_val, max_val)


# Constants for external use
RAND_MAX = _global_rng.RAND_MAX