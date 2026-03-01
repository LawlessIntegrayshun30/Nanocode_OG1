"""Placeholder tokenizer implementation."""

def tokenize(text: str) -> list[str]:
    """
    Split the input text into tokens separated by whitespace.
    
    Parameters:
        text (str): Input string to tokenize. Passing a non-string may raise a TypeError.
    
    Returns:
        list[str]: Tokens extracted from the input string.
    """
    return text.split()