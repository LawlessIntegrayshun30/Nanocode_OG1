"""General utilities."""
from typing import Iterable


def flatten(items: Iterable[Iterable]) -> list:
    """
    Flatten a two-level iterable into a single list preserving element order.
    
    Parameters:
        items (Iterable[Iterable]): An iterable whose elements are themselves iterables; each inner iterable's elements will be yielded in order.
    
    Returns:
        list: A list containing all elements from the inner iterables in the original iteration order.
    """
    return [element for sublist in items for element in sublist]