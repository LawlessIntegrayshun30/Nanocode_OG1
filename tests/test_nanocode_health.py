from nanocode.health import compute_health_score


def test_health_score_range():
    score = compute_health_score()
    assert 0.0 <= score <= 1.0
