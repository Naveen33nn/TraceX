from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import Settings
from app.core.address import detect_chain, normalize_chain, validate_for_chain
from app.vasp.etherscan import EtherscanMetadataProvider
from app.vasp.metasleuth import MetaSleuthProvider
from app.vasp.models import VASPCheckResult, VASPProviderResult, VASPVerdict
from app.vasp.walletexplorer import WalletExplorerProvider


class VASPService:
    def __init__(self, settings: Settings, providers: list[Any] | None = None):
        self.settings = settings
        self.cache_root = Path(self.settings.storage_dir) / "vasp"
        self.cache_root.mkdir(parents=True, exist_ok=True)
        self.providers = providers if providers is not None else self._build_default_providers()

    def _build_default_providers(self) -> list[Any]:
        mapping = {
            "metasleuth": MetaSleuthProvider(self.settings),
            "walletexplorer": WalletExplorerProvider(self.settings),
            "etherscan": EtherscanMetadataProvider(self.settings),
        }
        providers: list[Any] = []
        for name in self.settings.vasp_provider_list:
            provider = mapping.get(name)
            if provider is not None:
                providers.append(provider)
        return providers

    @staticmethod
    def _normalize_address(address: str) -> str:
        return address.strip()

    def _cache_path(self, provider_name: str, chain: str, address: str) -> Path:
        key = hashlib.sha256(f"{provider_name}:{chain}:{address.lower()}".encode("utf-8")).hexdigest()
        return self.cache_root / provider_name / chain / f"{key}.json"

    def _load_cache(self, path: Path) -> dict[str, Any] | None:
        if not path.exists():
            return None
        try:
            age = datetime.now(timezone.utc).timestamp() - path.stat().st_mtime
            if age > self.settings.vasp_label_ttl_seconds:
                return None
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None

    def _save_cache(self, path: Path, payload: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2, ensure_ascii=False, default=str), encoding="utf-8")

    async def _provider_lookup(self, provider: Any, address: str, chain: str, force_refresh: bool) -> VASPProviderResult:
        cache_path = self._cache_path(provider.name, chain, address)
        if not force_refresh:
            cached = self._load_cache(cache_path)
            if cached is not None:
                cached["cache_hit"] = True
                return VASPProviderResult(**cached)

        try:
            payload = await provider.lookup(address, chain)
        except Exception as exc:
            payload = {
                "provider": provider.name,
                "status": "error",
                "found": False,
                "cluster_found": False,
                "error": str(exc),
                "raw": {},
            }

        payload.setdefault("provider", provider.name)
        payload.setdefault("status", "ok")
        payload.setdefault("found", False)
        payload.setdefault("cluster_found", False)
        payload.setdefault("entity_name", "")
        payload.setdefault("label", "")
        payload.setdefault("entity_type", "")
        payload.setdefault("categories", [])
        payload.setdefault("attributes", [])
        payload.setdefault("wallet_id", "")
        payload.setdefault("confidence", "")
        payload.setdefault("error", "")
        payload.setdefault("raw", {})
        payload["cache_hit"] = False

        result = VASPProviderResult(**payload)
        if result.status != "error":
            self._save_cache(cache_path, result.model_dump(exclude_none=True))
        return result

    def _build_verdict(self, results: list[VASPProviderResult]) -> VASPVerdict:
        successful = [r.provider for r in results if r.status == "ok"]
        failed = [r.provider for r in results if r.status == "error"]
        cluster_providers = [r.provider for r in results if r.cluster_found and not r.entity_name]

        ordered_entities: list[str] = []
        providers_by_entity: dict[str, list[str]] = {}
        for result in results:
            if not result.entity_name:
                continue
            key = result.entity_name.strip().lower()
            if key not in providers_by_entity:
                ordered_entities.append(result.entity_name.strip())
                providers_by_entity[key] = []
            providers_by_entity[key].append(result.provider)

        if len(ordered_entities) > 1:
            state = "conflict"
            consensus = ""
            matching_providers: list[str] = []
            confidence = "conflict"
        elif len(ordered_entities) == 1:
            state = "identified"
            consensus = ordered_entities[0]
            matching_providers = providers_by_entity[consensus.lower()]
            confidence = "high" if len(matching_providers) > 1 else "medium"
        elif cluster_providers:
            state = "cluster_only"
            consensus = ""
            matching_providers = []
            confidence = "low"
        else:
            state = "unidentified"
            consensus = ""
            matching_providers = []
            confidence = "none"

        return VASPVerdict(
            state=state,
            identified=state == "identified",
            cluster_only=state == "cluster_only",
            conflict=state == "conflict",
            consensus=consensus,
            consensus_candidates=ordered_entities,
            matching_providers=matching_providers,
            cluster_providers=cluster_providers,
            successful_providers=successful,
            failed_providers=failed,
            provider_count=len(results),
            entity_count=len(ordered_entities),
            confidence=confidence,
        )

    def _resolve_chain(self, address: str, chain: str) -> str:
        chain = normalize_chain(chain)
        if chain == "auto":
            detected = detect_chain(address)
            if detected == "bitcoin":
                return "bitcoin"
            if detected == "evm":
                return "ethereum"
            if detected == "tron":
                return "tron"
            raise ValueError("Unsupported or invalid wallet address")
        if not validate_for_chain(address, chain):
            raise ValueError(f"Invalid address for selected chain '{chain}'")
        return chain

    async def check(self, address: str, chain: str = "auto", force_refresh: bool = False) -> dict[str, Any]:
        normalized_address = self._normalize_address(address)
        resolved_chain = self._resolve_chain(normalized_address, chain)

        if not self.providers:
            verdict = VASPVerdict(state="unidentified", identified=False, confidence="none")
            result = VASPCheckResult(
                address=normalized_address,
                chain=resolved_chain,
                checked_at=datetime.now(timezone.utc).isoformat(),
                cache_hit=False,
                verdict=verdict,
                providers=[],
            )
            return result.model_dump(exclude_none=True)

        tasks = [self._provider_lookup(provider, normalized_address, resolved_chain, force_refresh) for provider in self.providers]
        provider_results = await asyncio.gather(*tasks)
        verdict = self._build_verdict(provider_results)
        cache_hit = all(result.cache_hit for result in provider_results)
        result = VASPCheckResult(
            address=normalized_address,
            chain=resolved_chain,
            checked_at=datetime.now(timezone.utc).isoformat(),
            cache_hit=cache_hit,
            verdict=verdict,
            providers=provider_results,
        )
        return result.model_dump(exclude_none=True)

    async def check_addresses(
        self,
        addresses: list[str],
        chain: str = "auto",
        force_refresh: bool = False,
        max_concurrency: int = 5,
    ) -> dict[str, dict[str, Any]]:
        unique: list[str] = []
        seen: set[str] = set()
        for address in addresses:
            normalized = self._normalize_address(address)
            key = normalized.lower()
            if not normalized or key in seen:
                continue
            seen.add(key)
            unique.append(normalized)

        semaphore = asyncio.Semaphore(max_concurrency)

        async def run(one: str) -> tuple[str, dict[str, Any]]:
            async with semaphore:
                result = await self.check(one, chain, force_refresh)
                return one.lower(), result

        pairs = await asyncio.gather(*(run(address) for address in unique))
        return {key: value for key, value in pairs}
