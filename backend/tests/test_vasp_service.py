from __future__ import annotations

from pathlib import Path

from app.config import Settings
from app.vasp.service import VASPService


class StaticProvider:
    def __init__(self, name: str, payload: dict[str, object]):
        self.name = name
        self.payload = payload
        self.calls = 0

    async def lookup(self, address: str, chain: str) -> dict[str, object]:
        self.calls += 1
        return {**self.payload, "provider": self.name}


def build_settings(tmp_path: Path) -> Settings:
    return Settings(storage_dir=str(tmp_path), data_dir=str(tmp_path), vasp_label_ttl_seconds=3600)


def test_vasp_identified_and_cached(tmp_path):
    provider = StaticProvider("metasleuth", {"status": "ok", "found": True, "cluster_found": True, "entity_name": "Binance", "label": "Binance"})
    service = VASPService(build_settings(tmp_path), providers=[provider])

    import asyncio

    result1 = asyncio.run(service.check("0x" + "a" * 40, "ethereum", False))
    result2 = asyncio.run(service.check("0x" + "a" * 40, "ethereum", False))

    assert result1["verdict"]["state"] == "identified"
    assert result1["verdict"]["identified"] is True
    assert result2["cache_hit"] is True
    assert provider.calls == 1


def test_vasp_cluster_only_and_conflict(tmp_path):
    cluster_provider = StaticProvider("walletexplorer", {"status": "ok", "found": False, "cluster_found": True, "wallet_id": "w1"})
    conflict_a = StaticProvider("metasleuth", {"status": "ok", "found": True, "cluster_found": True, "entity_name": "Binance", "label": "Binance"})
    conflict_b = StaticProvider("etherscan", {"status": "ok", "found": True, "cluster_found": True, "entity_name": "Coinbase", "label": "Coinbase"})

    import asyncio

    cluster_service = VASPService(build_settings(tmp_path / "cluster"), providers=[cluster_provider])
    cluster_result = asyncio.run(cluster_service.check("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bitcoin", False))
    assert cluster_result["verdict"]["state"] == "cluster_only"
    assert cluster_result["verdict"]["cluster_only"] is True

    conflict_service = VASPService(build_settings(tmp_path / "conflict"), providers=[conflict_a, conflict_b])
    conflict_result = asyncio.run(conflict_service.check("0x" + "b" * 40, "ethereum", False))
    assert conflict_result["verdict"]["state"] == "conflict"
    assert conflict_result["verdict"]["conflict"] is True
