"""Vector store abstraction placeholder."""
from typing import Dict, List


class InMemoryStore:
    def __init__(self) -> None:
        """
        Initialize an in-memory vector store.
        
        Creates an empty dictionary `self.store` that maps string keys to lists of floats for storing vectors.
        """
        self.store: Dict[str, List[float]] = {}

    def add(self, key: str, vector: List[float]) -> None:
        """
        Store a vector under the given key in the in-memory store, replacing any existing value.
        
        Parameters:
            key (str): The identifier under which to store the vector.
            vector (List[float]): The numeric vector to store; existing vector for `key` will be overwritten.
        """
        self.store[key] = vector

    def get(self, key: str) -> List[float] | None:
        """
        Retrieve the vector stored under the given key.
        
        Parameters:
            key (str): The storage key identifying the vector.
        
        Returns:
            List[float] | None: The vector associated with `key`, or `None` if the key is not present.
        """
        return self.store.get(key)