"""
C-Style Memory Manager

This module simulates C-style memory management with malloc/free behavior
to ensure identical memory access patterns and lifecycle management.
"""

import ctypes
from typing import Dict, Any, Optional, Union

try:
    from .c_types_compatibility import c_void_p, c_size_t
except ImportError:
    # Direct execution - import without relative path
    import sys
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    from c_types_compatibility import c_void_p, c_size_t


class CMemoryBlock:
    """Represents a C-style memory block allocated with malloc."""
    
    def __init__(self, size: int, c_type=None):
        """
        Create a memory block.
        
        Args:
            size: Size in bytes
            c_type: Optional ctypes type for typed access
        """
        self.size = size
        self.c_type = c_type
        self.is_freed = False
        
        # Allocate raw memory block
        if c_type:
            # Typed allocation
            array_type = c_type * (size // ctypes.sizeof(c_type))
            self._memory = array_type()
            self._ptr = ctypes.cast(self._memory, c_void_p)
        else:
            # Raw byte allocation
            byte_array = (ctypes.c_ubyte * size)()
            self._memory = byte_array
            self._ptr = ctypes.cast(byte_array, c_void_p)
    
    def get_ptr(self) -> c_void_p:
        """Get void pointer to memory block."""
        if self.is_freed:
            raise RuntimeError("Use after free - accessing freed memory")
        return self._ptr
    
    def get_typed_ptr(self, c_type):
        """Get typed pointer to memory block."""
        if self.is_freed:
            raise RuntimeError("Use after free - accessing freed memory")
        return ctypes.cast(self._ptr, ctypes.POINTER(c_type))
    
    def read(self, offset: int = 0, c_type=None):
        """Read value from memory block."""
        if self.is_freed:
            raise RuntimeError("Use after free - accessing freed memory")
        
        if c_type is None:
            c_type = ctypes.c_ubyte
        
        if offset + ctypes.sizeof(c_type) > self.size:
            raise RuntimeError("Buffer overflow - reading beyond allocated memory")
        
        ptr = ctypes.cast(
            ctypes.addressof(self._memory) + offset,
            ctypes.POINTER(c_type)
        )
        return ptr.contents.value
    
    def write(self, value: Any, offset: int = 0, c_type=None):
        """Write value to memory block."""
        if self.is_freed:
            raise RuntimeError("Use after free - accessing freed memory")
        
        if c_type is None:
            c_type = type(value) if hasattr(value, '_type_') else ctypes.c_ubyte
        
        if offset + ctypes.sizeof(c_type) > self.size:
            raise RuntimeError("Buffer overflow - writing beyond allocated memory")
        
        ptr = ctypes.cast(
            ctypes.addressof(self._memory) + offset,
            ctypes.POINTER(c_type)
        )
        ptr.contents = c_type(value)
    
    def zero_memory(self):
        """Zero out the memory block (like calloc)."""
        if self.is_freed:
            raise RuntimeError("Use after free - accessing freed memory")
        
        # Zero out all bytes
        for i in range(self.size):
            self._memory[i] = 0


class CMemoryManager:
    """
    C-style memory manager that simulates malloc/free behavior.
    """
    
    def __init__(self):
        """Initialize the memory manager."""
        self._allocated_blocks: Dict[int, CMemoryBlock] = {}
        self._next_id = 1
    
    def malloc(self, size: int, c_type=None) -> Optional[CMemoryBlock]:
        """
        Allocate memory block like C's malloc().
        
        Args:
            size: Size in bytes to allocate
            c_type: Optional ctypes type for typed allocation
            
        Returns:
            CMemoryBlock or None if allocation fails
        """
        if size <= 0:
            return None
        
        try:
            block = CMemoryBlock(size, c_type)
            block_id = self._next_id
            self._allocated_blocks[block_id] = block
            self._next_id += 1
            return block
        except MemoryError:
            return None
    
    def calloc(self, num_elements: int, element_size: int, c_type=None) -> Optional[CMemoryBlock]:
        """
        Allocate and zero memory like C's calloc().
        
        Args:
            num_elements: Number of elements
            element_size: Size of each element in bytes
            c_type: Optional ctypes type
            
        Returns:
            CMemoryBlock or None if allocation fails
        """
        total_size = num_elements * element_size
        block = self.malloc(total_size, c_type)
        if block:
            block.zero_memory()
        return block
    
    def free(self, block: CMemoryBlock) -> None:
        """
        Free memory block like C's free().
        
        Args:
            block: Memory block to free
        """
        if block is None:
            return  # C's free(NULL) is a no-op
        
        if block.is_freed:
            raise RuntimeError("Double free detected")
        
        block.is_freed = True
        
        # Find and remove from allocated blocks
        block_id = None
        for bid, b in self._allocated_blocks.items():
            if b is block:
                block_id = bid
                break
        
        if block_id is not None:
            del self._allocated_blocks[block_id]
    
    def realloc(self, block: Optional[CMemoryBlock], new_size: int, c_type=None) -> Optional[CMemoryBlock]:
        """
        Reallocate memory block like C's realloc().
        
        Args:
            block: Existing block to resize (can be None)
            new_size: New size in bytes
            c_type: Optional ctypes type
            
        Returns:
            New CMemoryBlock or None if allocation fails
        """
        if block is None:
            # realloc(NULL, size) == malloc(size)
            return self.malloc(new_size, c_type)
        
        if new_size == 0:
            # realloc(ptr, 0) == free(ptr); return NULL
            self.free(block)
            return None
        
        # Allocate new block
        new_block = self.malloc(new_size, c_type)
        if new_block is None:
            return None
        
        # Copy data from old block
        copy_size = min(block.size, new_size)
        for i in range(copy_size):
            new_block._memory[i] = block._memory[i]
        
        # Free old block
        self.free(block)
        
        return new_block
    
    def get_allocated_count(self) -> int:
        """Get number of currently allocated blocks."""
        return len(self._allocated_blocks)
    
    def get_total_allocated_bytes(self) -> int:
        """Get total bytes currently allocated."""
        return sum(block.size for block in self._allocated_blocks.values())
    
    def check_leaks(self) -> bool:
        """Check for memory leaks."""
        return len(self._allocated_blocks) > 0
    
    def cleanup_all(self) -> None:
        """Free all allocated blocks (for cleanup)."""
        for block in list(self._allocated_blocks.values()):
            self.free(block)


# Global memory manager instance
_global_memory_manager = CMemoryManager()


def malloc(size: int, c_type=None) -> Optional[CMemoryBlock]:
    """Global malloc function matching C behavior."""
    return _global_memory_manager.malloc(size, c_type)


def calloc(num_elements: int, element_size: int, c_type=None) -> Optional[CMemoryBlock]:
    """Global calloc function matching C behavior."""
    return _global_memory_manager.calloc(num_elements, element_size, c_type)


def free(block: CMemoryBlock) -> None:
    """Global free function matching C behavior."""
    _global_memory_manager.free(block)


def realloc(block: Optional[CMemoryBlock], new_size: int, c_type=None) -> Optional[CMemoryBlock]:
    """Global realloc function matching C behavior."""
    return _global_memory_manager.realloc(block, new_size, c_type)


def check_memory_leaks() -> bool:
    """Check for memory leaks in global manager."""
    return _global_memory_manager.check_leaks()


def cleanup_all_memory() -> None:
    """Cleanup all allocated memory."""
    _global_memory_manager.cleanup_all()


def get_memory_stats() -> Dict[str, int]:
    """Get memory allocation statistics."""
    return {
        'allocated_blocks': _global_memory_manager.get_allocated_count(),
        'total_bytes': _global_memory_manager.get_total_allocated_bytes()
    }