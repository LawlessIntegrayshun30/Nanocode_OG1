"""Simple health scoring for the service."""
import random


def compute_health_score() -> float:
    # Placeholder health calculation; deterministic for tests
    """
    Compute a deterministic placeholder health score for the service.
    
    The score is in the range [0.8, 1.0) and is rounded to three decimal places; the result is deterministic to support tests.
    Returns:
        float: Health score between 0.8 (inclusive) and 1.0 (exclusive), rounded to three decimals.
    """
    random.seed(42)
    return round(random.uniform(0.8, 1.0), 3)