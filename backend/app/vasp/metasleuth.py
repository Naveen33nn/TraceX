from __future__ import annotations

from typing import Any

import httpx

from app.config import Settings


class MetaSleuthProvider:
    name = "metasleuth"

    CHAIN_IDS = {
        "bitcoin": -1,
        "tron": -2,
        "ethereum": 1,
        "polygon": 137,
    }

    def __init__(self, settings: Settings):
        self.settings = settings

    async def lookup(self, address: str, chain: str) -> dict[str, Any]:
        if not self.settings.metasleuth_api_key:
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

        url = self.settings.metasleuth_base_url.rstrip("/") + "/address-label/api/v3/labels"
        headers = {
            "API-KEY": self.settings.metasleuth_api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {"chain_id": chain_id, "address": address}

        async with httpx.AsyncClient(timeout=self.settings.http_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            body = response.json()

        if response.status_code >= 400:
            return {
                "provider": self.name,
                "status": "error",
                "found": False,
                "cluster_found": False,
                "chain_id": chain_id,
                "error": body if isinstance(body, dict) else {"detail": str(body)},
                "raw": body if isinstance(body, dict) else {"detail": str(body)},
            }

        data = body.get("data") or {}
        main_entity = data.get("main_entity") or ""
        name_tag = data.get("name_tag") or ""
        info = data.get("main_entity_info") or {}
        categories = [item.get("name") for item in (info.get("categories") or []) if isinstance(item, dict) and item.get("name")]
        attributes = [item for item in (data.get("attributes") or []) if isinstance(item, dict)]

        return {
            "provider": self.name,
            "status": "ok",
            "found": bool(main_entity),
            "cluster_found": bool(name_tag) or bool(main_entity),
            "entity_name": main_entity,
            "label": name_tag,
            "entity_type": categories[0] if categories else "",
            "categories": categories,
            "attributes": attributes,
            "chain_id": chain_id,
            "confidence": "provider" if main_entity else ("weak" if name_tag else ""),
            "raw": body,
        }
