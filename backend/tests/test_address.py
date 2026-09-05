from app.core.address import detect_chain, normalize_chain, validate_for_chain
from fastapi.testclient import TestClient
from app.main import app

def test_eth_detection():
    assert detect_chain("0x0000000000000000000000000000000000000000") == "evm"

def test_btc_detection():
    assert detect_chain("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa") == "bitcoin"

def test_selected_chain_validation():
    assert validate_for_chain("0x0000000000000000000000000000000000000000", "ethereum")
    assert validate_for_chain("0x0000000000000000000000000000000000000000", "polygon")
    assert validate_for_chain("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb", "tron")

def test_chain_normalization():
    assert normalize_chain("ETH") == "ethereum"
    assert normalize_chain("btc") == "bitcoin"
    assert normalize_chain("matic") == "polygon"
    assert normalize_chain("trx") == "tron"

def test_resolve_endpoint():
    client = TestClient(app)
    r = client.get("/api/v1/resolve", params={"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"})
    assert r.status_code == 200
    assert r.json()["suggested_chain"] == "bitcoin"
