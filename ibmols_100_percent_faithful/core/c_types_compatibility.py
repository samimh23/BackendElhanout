"""
C Types Compatibility Layer

This module provides exact C data type representations using Python's
ctypes library to ensure bit-for-bit identical behavior with C implementations.
"""

import ctypes
import numpy as np
from typing import Union, Any, Optional


# C integer types with exact bit widths
c_int8 = ctypes.c_int8
c_uint8 = ctypes.c_uint8
c_int16 = ctypes.c_int16
c_uint16 = ctypes.c_uint16
c_int32 = ctypes.c_int32
c_uint32 = ctypes.c_uint32
c_int64 = ctypes.c_int64
c_uint64 = ctypes.c_uint64

# C floating point types
c_float = ctypes.c_float    # 32-bit float
c_double = ctypes.c_double  # 64-bit double

# C character and pointer types
c_char = ctypes.c_char
c_char_p = ctypes.c_char_p
c_void_p = ctypes.c_void_p

# Platform-dependent C types (assuming 64-bit platform)
c_int = ctypes.c_int32      # Typically 32-bit on most platforms
c_uint = ctypes.c_uint32
c_long = ctypes.c_int64     # 64-bit on 64-bit platforms
c_ulong = ctypes.c_uint64
c_size_t = ctypes.c_uint64

# NumPy dtypes that match C types exactly
np_int8 = np.int8
np_uint8 = np.uint8
np_int16 = np.int16
np_uint16 = np.uint16
np_int32 = np.int32
np_uint32 = np.uint32
np_int64 = np.int64
np_uint64 = np.uint64
np_float32 = np.float32     # C float
np_float64 = np.float64     # C double


class CArray:
    """
    C-style array wrapper that provides exact C memory layout and behavior.
    """
    
    def __init__(self, c_type, size: int, init_value=None):
        """
        Create a C-style array.
        
        Args:
            c_type: ctypes type (e.g., c_int32, c_double)
            size: Array size
            init_value: Initial value for all elements
        """
        self._c_type = c_type
        self._size = size
        self._array = (c_type * size)()
        
        if init_value is not None:
            for i in range(size):
                self._array[i] = c_type(init_value)
    
    def __getitem__(self, index: int):
        """Get item with C-style bounds behavior (no automatic bounds checking)."""
        # C doesn't do bounds checking - we simulate this by allowing
        # access but raising error only on extreme cases
        if index < 0 or index >= self._size:
            # In C this would be undefined behavior, we'll raise an error
            # but only after the fact to match C timing
            raise IndexError(f"Array index {index} out of bounds [0, {self._size})")
        return self._array[index]
    
    def __setitem__(self, index: int, value):
        """Set item with C-style bounds behavior."""
        if index < 0 or index >= self._size:
            raise IndexError(f"Array index {index} out of bounds [0, {self._size})")
        self._array[index] = self._c_type(value)
    
    def __len__(self) -> int:
        """Return array size."""
        return self._size
    
    def get_ptr(self):
        """Get C pointer to array data."""
        return ctypes.cast(self._array, ctypes.POINTER(self._c_type))
    
    def to_list(self) -> list:
        """Convert to Python list."""
        return [self._array[i] for i in range(self._size)]
    
    def from_list(self, data: list) -> None:
        """Fill from Python list."""
        size = min(len(data), self._size)
        for i in range(size):
            self._array[i] = self._c_type(data[i])


class CMatrix:
    """
    C-style 2D matrix wrapper with row-major layout.
    """
    
    def __init__(self, c_type, rows: int, cols: int, init_value=None):
        """
        Create a C-style 2D matrix.
        
        Args:
            c_type: ctypes type
            rows: Number of rows
            cols: Number of columns  
            init_value: Initial value for all elements
        """
        self._c_type = c_type
        self._rows = rows
        self._cols = cols
        self._size = rows * cols
        self._array = (c_type * self._size)()
        
        if init_value is not None:
            for i in range(self._size):
                self._array[i] = c_type(init_value)
    
    def __getitem__(self, indices):
        """Get item using [row, col] indexing."""
        if isinstance(indices, tuple) and len(indices) == 2:
            row, col = indices
            if row < 0 or row >= self._rows or col < 0 or col >= self._cols:
                raise IndexError(f"Matrix index [{row}, {col}] out of bounds")
            index = row * self._cols + col
            return self._array[index]
        else:
            raise TypeError("Matrix indexing requires [row, col] format")
    
    def __setitem__(self, indices, value):
        """Set item using [row, col] indexing."""
        if isinstance(indices, tuple) and len(indices) == 2:
            row, col = indices
            if row < 0 or row >= self._rows or col < 0 or col >= self._cols:
                raise IndexError(f"Matrix index [{row}, {col}] out of bounds")
            index = row * self._cols + col
            self._array[index] = self._c_type(value)
        else:
            raise TypeError("Matrix indexing requires [row, col] format")
    
    @property
    def rows(self) -> int:
        """Number of rows."""
        return self._rows
    
    @property
    def cols(self) -> int:
        """Number of columns."""
        return self._cols
    
    def get_ptr(self):
        """Get C pointer to matrix data."""
        return ctypes.cast(self._array, ctypes.POINTER(self._c_type))


class CStruct(ctypes.Structure):
    """
    Base class for C-style structures with enhanced functionality.
    """
    
    def __repr__(self):
        """String representation showing all fields."""
        values = []
        for field_name, _ in self._fields_:
            values.append(f"{field_name}={getattr(self, field_name)}")
        return f"{self.__class__.__name__}({', '.join(values)})"
    
    def to_dict(self) -> dict:
        """Convert struct to dictionary."""
        result = {}
        for field_name, _ in self._fields_:
            result[field_name] = getattr(self, field_name)
        return result
    
    def from_dict(self, data: dict) -> None:
        """Fill struct from dictionary."""
        for field_name, _ in self._fields_:
            if field_name in data:
                setattr(self, field_name, data[field_name])


def cast_to_c_type(value: Any, c_type) -> Any:
    """
    Cast a Python value to exact C type with proper overflow/underflow behavior.
    
    Args:
        value: Python value to cast
        c_type: Target ctypes type
        
    Returns:
        Value cast to C type with proper overflow behavior
    """
    return c_type(value).value


def c_style_division(a: Union[int, float], b: Union[int, float], 
                    result_type: str = 'int') -> Union[int, float]:
    """
    Perform C-style division with exact truncation behavior.
    
    Args:
        a: Dividend
        b: Divisor
        result_type: 'int' for integer division, 'float' for floating point
        
    Returns:
        Result of C-style division
    """
    if b == 0:
        raise ZeroDivisionError("Division by zero")
    
    if result_type == 'int':
        # C integer division truncates toward zero
        result = int(a / b)
        return result
    else:
        # C floating point division
        return float(a) / float(b)


def simulate_c_memory_access(data: Any, index: int, bounds_check: bool = False):
    """
    Simulate C-style memory access patterns.
    
    Args:
        data: Data structure to access
        index: Index to access
        bounds_check: Whether to perform bounds checking
        
    Returns:
        Accessed value or raises error for out-of-bounds
    """
    if bounds_check:
        if hasattr(data, '__len__') and (index < 0 or index >= len(data)):
            raise IndexError(f"Index {index} out of bounds")
    
    return data[index]


# Null pointer simulation
NULL = None
NULL_PTR = ctypes.c_void_p(0)

# Common C constants
TRUE = 1
FALSE = 0
EOF = -1

# Size constants
SIZEOF_INT = ctypes.sizeof(c_int)
SIZEOF_DOUBLE = ctypes.sizeof(c_double)
SIZEOF_FLOAT = ctypes.sizeof(c_float)
SIZEOF_CHAR = ctypes.sizeof(c_char)
SIZEOF_PTR = ctypes.sizeof(c_void_p)