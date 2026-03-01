"""Embedding service client placeholder."""

def embed(text: str) -> list[float]:
    """
    Create a placeholder embedding vector for the given text.
    
    This implementation returns a single-element embedding equal to the length of the input string converted to a float.
    
    Parameters:
        text (str): Input text to embed.
    
    Returns:
        list[float]: A one-element list containing the input text length as a float.
    """
    return [float(len(text))]