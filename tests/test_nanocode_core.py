from nanocode.core import postprocess_output, preprocess_prompt
from nanocode.schema import NanocodeRequest


def test_preprocess_prompt_contains_input():
    req = NanocodeRequest(input="do something")
    prompt = preprocess_prompt(req)
    assert "do something" in prompt


def test_postprocess_output_maps_output():
    req = NanocodeRequest(input="do something")
    result = postprocess_output(req, {"output": "done"})
    assert result.output == "done"
