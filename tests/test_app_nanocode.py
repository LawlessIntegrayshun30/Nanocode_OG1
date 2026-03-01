from fastapi.testclient import TestClient

from app.main import app
from app.model_client import ModelClient
from app.dependencies import get_model_client


class StubModelClient(ModelClient):
    async def generate(self, prompt: str, **kwargs):
        """
        Create a deterministic stubbed generation result for the given prompt.
        
        Parameters:
            prompt (str): Input prompt to include in the stubbed output.
        
        Returns:
            dict: A mapping with key "output" whose value is the string "stubbed {prompt}".
        """
        return {"output": f"stubbed {prompt}"}


def override_client():
    """
    Provide a stubbed ModelClient instance configured for tests.
    
    Returns:
        StubModelClient: A stubbed model client instance with base_url "http://stub".
    """
    return StubModelClient(base_url="http://stub")


app.dependency_overrides[get_model_client] = override_client

client = TestClient(app)


def test_nanocode_generate_endpoint():
    response = client.post("/nanocode", json={"input": "hello"})
    assert response.status_code == 200
    data = response.json()
    assert data["output"].startswith("stubbed")
