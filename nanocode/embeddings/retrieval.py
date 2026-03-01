"""Retrieval placeholder for embeddings."""
from nanocode.embeddings.store import InMemoryStore


class Retriever:
    def __init__(self, store: InMemoryStore) -> None:
        """
        Initialize the Retriever with the provided in-memory embeddings store.
        
        Parameters:
            store (InMemoryStore): The in-memory store used to retrieve embeddings.
        """
        self.store = store

    def retrieve(self, key: str) -> list[float] | None:
        """
        Retrieve an embedding vector stored under the given key.
        
        Parameters:
            key (str): Identifier for the stored embedding.
        
        Returns:
            The embedding vector as a list of floats, or `None` if no embedding exists for the given key.
        """
        return self.store.get(key)