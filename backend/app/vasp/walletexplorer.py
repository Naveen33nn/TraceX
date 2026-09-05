from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings


class WalletExplorerProvider:
    name = "walletexplorer"

    def __init__(self, settings: Settings):
        self.settings = settings

    async def lookup(self, address: str, chain: str) -> dict[str, Any]:
        if chain != "bitcoin":
            return {
                "provider": self.name,
                "status": "unsupported_chain",
                "found": False,
                "cluster_found": False,
                "error": "",
                "raw": {},
            }

        base = self.settings.walletexplorer_base_url.rstrip("/")
        async with httpx.AsyncClient(timeout=self.settings.http_timeout_seconds) as client:
            response = await client.get(base + "/address-lookup", params={"address": address})
            body = response.json()

        if response.status_code >= 400:
            return {
                "provider": self.name,
                "status": "error",
                "found": False,
                "cluster_found": False,
                "error": body if isinstance(body, dict) else {"detail": str(body)},
                "raw": body if isinstance(body, dict) else {"detail": str(body)},
            }

        label = body.get("label") or body.get("name") or ""
        wallet_id = body.get("wallet_id") or ""
        cluster_found = bool(body.get("found"))

        return {
            "provider": self.name,
            "status": "ok",
            "found": bool(label),
            "cluster_found": cluster_found,
            "entity_name": label,
            "label": label,
            "wallet_id": wallet_id,
            "confidence": "provider" if label else ("cluster" if cluster_found else ""),
            "raw": body,
        }
