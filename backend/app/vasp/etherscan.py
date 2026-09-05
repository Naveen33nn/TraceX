from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings


class EtherscanMetadataProvider:
    name = "etherscan"

    CHAIN_IDS = {
        "ethereum": "1",
        "polygon": "137",
    }

    def __init__(self, settings: Settings):
        self.settings = settings

    async def lookup(self, address: str, chain: str) -> dict[str, Any]:
        if not self.settings.etherscan_api_key:
            return {
                "provider": self.name,
                "status": "not_configured",
                "found": False,
                "cluster_found": False,
                "error": "",
                "raw": {},
            }
        chain_id = self.CHAIN_IDS.get(chain)
        if chain_id is None:
            return {
                "provider": self.name,
                "status": "unsupported_chain",
                "found": False,
                "cluster_found": False,
                "error": "",
                "raw": {},
            }

        params = {
            "chainid": chain_id,
            "module": "nametag",
            "action": "getaddresstag",
            "address": address,
            "apikey": self.settings.etherscan_api_key,
        }
        async with httpx.AsyncClient(timeout=self.settings.http_timeout_seconds) as client:
            response = await client.get("https://api.etherscan.io/v2/api", params=params)
            body = response.json()

        if response.status_code >= 400:
            return {
                "provider": self.name,
                "status": "error",
                "found": False,
                "cluster_found": False,
                "chain_id": int(chain_id),
                "error": body if isinstance(body, dict) else {"detail": str(body)},
                "raw": body if isinstance(body, dict) else {"detail": str(body)},
            }

        result = body.get("result") or []
        if not isinstance(result, list):
            result = [result]
        first = result[0] if result else {}
        labels = [item for item in (first.get("labels") or []) if isinstance(item, str) and item.strip()]
        nametag = first.get("nametag") or ""
        entity_name = labels[0] if labels else nametag

        return {
            "provider": self.name,
            "status": "ok",
            "found": bool(entity_name),
            "cluster_found": bool(entity_name),
            "entity_name": entity_name,
            "label": nametag,
            "entity_type": labels[0] if labels else "",
            "categories": labels,
            "confidence": "provider" if entity_name else "",
            "raw": body,
        }
