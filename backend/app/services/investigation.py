from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
from typing import Any

from app.config import Settings
from app.connectors.alchemy import AlchemyConnector
from app.connectors.bitquery import BitqueryConnector
from app.connectors.blockchain_com import BlockchainComConnector
from app.connectors.etherscan import EtherscanConnector
from app.connectors.infura import InfuraConnector
from app.connectors.trongrid import TronGridConnector
from app.core.address import detect_chain, normalize_chain, validate_for_chain
from app.core.graph import build_transaction_graph
from app.core.normalize import derive_features, public_event, sort_events, strip_none
from app.graph.service import get_graph_service
from app.schemas.models import InvestigationRequest
from app.storage.json_store import save_snapshot
from app.vasp.service import VASPService


class InvestigationService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.bc = BlockchainComConnector(settings)
        self.etherscan = EtherscanConnector(settings)
        self.infura = InfuraConnector(settings)
        self.bitquery = BitqueryConnector(settings)
        self.alchemy = AlchemyConnector(settings)
        self.trongrid = TronGridConnector(settings)
        self.vasp = VASPService(settings)

    def resolve_chain(self, request: InvestigationRequest) -> str:
        chain = normalize_chain(request.chain)
        if chain == "auto":
            detected = detect_chain(request.address)
            if detected == "bitcoin":
                return "bitcoin"
            if detected == "evm":
                return "ethereum"
            if detected == "tron":
                return "tron"
            raise ValueError("Unsupported or invalid wallet address")
        if not validate_for_chain(request.address, chain):
            raise ValueError(f"Invalid address for selected chain '{chain}'")
        return chain

    @staticmethod
    def _decimal_string(raw_value: Any, scale: int) -> str:
        try:
            return str(Decimal(str(raw_value)) / Decimal(scale))
        except Exception:
            return ""

    @staticmethod
    def _best_vasp_label(result: dict[str, Any] | None) -> str:
        if not result:
            return ""
        verdict = result.get("verdict") or {}
        if verdict.get("state") == "identified" and verdict.get("consensus"):
            return str(verdict.get("consensus") or "")
        if verdict.get("state") == "conflict":
            return "conflict"
        providers = result.get("providers") or []
        for provider in providers:
            if provider.get("label"):
                return str(provider.get("label") or "")
            if provider.get("entity_name"):
                return str(provider.get("entity_name") or "")
            if provider.get("wallet_id"):
                return str(provider.get("wallet_id") or "")
        return ""

    async def _enrich_vasp(self, chain: str, target_address: str, counterparties: list[dict[str, Any]]) -> dict[str, Any]:
        addresses = [target_address] + [item["address"] for item in counterparties]
        results = await self.vasp.check_addresses(addresses, chain=chain, force_refresh=False)
        target_key = target_address.lower()
        target = results.get(target_key, {})

        ordered_counterparties: list[dict[str, Any]] = []
        for item in counterparties:
            result = results.get(item["address"].lower(), {})
            verdict = result.get("verdict") or {}
            ordered_counterparties.append(
                {
                    "address": item["address"],
                    "count": item["count"],
                    "vasp_state": verdict.get("state", "unidentified"),
                    "identified": bool(verdict.get("identified")),
                    "entity_name": verdict.get("consensus") or self._best_vasp_label(result),
                    "cache_hit": bool(result.get("cache_hit")),
                }
            )

        address_labels = {}
        for addr, result in results.items():
            label = self._best_vasp_label(result)
            if label:
                address_labels[addr.lower()] = label

        state_counts = Counter((result.get("verdict") or {}).get("state", "unidentified") for result in results.values())
        identified_count = sum(1 for result in results.values() if (result.get("verdict") or {}).get("identified"))

        return {
            "status": "ok",
            "target": target,
            "counterparties": {item["address"].lower(): results.get(item["address"].lower(), {}) for item in counterparties},
            "counterparty_order": ordered_counterparties,
            "address_labels": address_labels,
            "identified_count": identified_count,
            "state_counts": dict(state_counts),
        }

    def _dedupe_events(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for event in events:
            key = event.get("event_id") or event.get("tx_hash")
            if not key:
                key = f"{event.get('chain')}:{event.get('timestamp')}:{event.get('from_address')}:{event.get('to_address')}:{event.get('amount_raw')}"
            if key in seen:
                continue
            seen.add(key)
            deduped.append(event)
        return deduped

    def _counterparties_from_events(self, address: str, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        target = address.lower()
        counts: Counter[str] = Counter()
        for event in events:
            for candidate in event.get("counterparty_addresses", []) or []:
                if candidate and candidate.lower() != target:
                    counts[candidate] += 1
        return [{"address": addr, "count": count} for addr, count in counts.most_common()]

    async def investigate(self, request: InvestigationRequest) -> dict[str, Any]:
        chain = self.resolve_chain(request)
        limit = request.max_records or self.settings.max_records
        page_size = request.page_size or self.settings.page_size
        max_pages = request.max_pages or self.settings.max_pages
        investigation_id = uuid4().hex
        queried_at = datetime.now(timezone.utc).isoformat()

        provider_status: dict[str, Any] = {}
        errors: list[str] = []
        raw: dict[str, Any] = {"provider_responses": {}}
        wallet: dict[str, Any] = {"address": request.address, "chain": chain}
        events: list[dict[str, Any]] = []
        assets: list[Any] = []

        if chain == "bitcoin":
            try:
                pages: list[dict[str, Any]] = []
                remaining = limit
                offset = 0
                while remaining > 0:
                    page_limit = min(page_size, 50, remaining)
                    data = await self.bc.fetch_address(request.address, page_limit, offset)
                    pages.append(data)
                    wallet_snapshot, page_events = self.bc.normalize(request.address, data)
                    events.extend([e.model_dump() for e in page_events])
                    if pages and len(data.get("txs", [])) < page_limit:
                        break
                    got = len(data.get("txs", [])) if isinstance(data, dict) else 0
                    if got == 0:
                        break
                    offset += got
                    remaining -= got
                last = pages[-1] if pages else {}
                wallet.update(
                    {
                        "native_currency": "BTC",
                        "native_balance_raw": str(last.get("final_balance", 0) or 0),
                        "native_balance": self._decimal_string(last.get("final_balance", 0) or 0, 100_000_000),
                        "total_received_raw": str(last.get("total_received", 0) or 0),
                        "total_received": self._decimal_string(last.get("total_received", 0) or 0, 100_000_000),
                        "total_sent_raw": str(last.get("total_sent", 0) or 0),
                        "total_sent": self._decimal_string(last.get("total_sent", 0) or 0, 100_000_000),
                        "transaction_count": last.get("n_tx"),
                    }
                )
                raw["provider_responses"]["blockchain_com"] = pages
                provider_status["blockchain_com"] = {"status": "ok", "pages_fetched": len(pages)}
            except Exception as exc:
                provider_status["blockchain_com"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            if self.settings.bitquery_access_token:
                provider_status["bitquery"] = {"status": "available", "detail": "Optional enrichment connector loaded"}
            else:
                provider_status["bitquery"] = {"status": "skipped", "detail": "Token not configured"}

        elif chain in {"ethereum", "polygon"}:
            try:
                balance = await self.etherscan.balance(request.address, chain)
                raw["provider_responses"]["etherscan_balance"] = balance
                provider_status["etherscan_balance"] = {"status": "ok"}
                wallet["native_currency"] = "ETH" if chain == "ethereum" else "MATIC"
                wallet["native_balance_raw"] = str(balance.get("result") or "")
                wallet["native_balance"] = self._decimal_string(balance.get("result") or 0, 10**18)
            except Exception as exc:
                provider_status["etherscan_balance"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            try:
                rows = await self.etherscan.normal_transactions(request.address, chain, limit)
                norm = self.etherscan.normalize_native(request.address, chain, rows)
                events.extend([x.model_dump() for x in norm])
                raw["provider_responses"]["etherscan_transactions"] = rows
                provider_status["etherscan_transactions"] = {"status": "ok", "records": len(rows)}
            except Exception as exc:
                provider_status["etherscan_transactions"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            try:
                rows = await self.etherscan.erc20_transfers(request.address, chain, limit)
                norm = self.etherscan.normalize_tokens(request.address, chain, rows)
                events.extend([x.model_dump() for x in norm])
                raw["provider_responses"]["etherscan_erc20"] = rows
                provider_status["etherscan_erc20"] = {"status": "ok", "records": len(rows)}
            except Exception as exc:
                provider_status["etherscan_erc20"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            try:
                rows = await self.etherscan.internal_transactions(request.address, chain, limit)
                norm = self.etherscan.normalize_internal(request.address, chain, rows)
                events.extend([x.model_dump() for x in norm])
                raw["provider_responses"]["etherscan_internal"] = rows
                provider_status["etherscan_internal"] = {"status": "ok", "records": len(rows)}
            except Exception as exc:
                provider_status["etherscan_internal"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            try:
                arows = await self.alchemy.all_asset_transfers(request.address, chain, limit)
                anorm = self.alchemy.normalize_transfers(request.address, chain, arows)
                events.extend([x.model_dump() for x in anorm])
                raw["provider_responses"]["alchemy_asset_transfers"] = arows
                provider_status["alchemy_asset_transfers"] = {"status": "ok", "records": len(arows)}
            except Exception as exc:
                provider_status["alchemy_asset_transfers"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            if self.settings.alchemy_include_token_balances:
                try:
                    token_assets = await self.alchemy.token_balances(request.address, chain)
                    token_assets = await self.alchemy.enrich_assets(chain, token_assets)
                    assets = token_assets
                    raw["provider_responses"]["alchemy_token_balances"] = [a.model_dump() for a in token_assets]
                    provider_status["alchemy_token_balances"] = {"status": "ok", "records": len(token_assets)}
                except Exception as exc:
                    provider_status["alchemy_token_balances"] = {"status": "error", "detail": str(exc)}
                    errors.append(str(exc))

            try:
                wallet["rpc_native_balance_raw"] = await self.infura.native_balance(chain, request.address)
                wallet["rpc_native_balance"] = self._decimal_string(wallet["rpc_native_balance_raw"], 10**18)
                provider_status["infura"] = {"status": "ok"}
            except Exception as exc:
                provider_status["infura"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

            if self.settings.alchemy_verify_transactions:
                sample = [event for event in events if event.get("provider") == "etherscan" and event.get("tx_hash")][:10]
                checks = []
                for event in sample:
                    try:
                        tx = await self.alchemy.transaction_by_hash(chain, event["tx_hash"])
                        receipt = await self.alchemy.transaction_receipt(chain, event["tx_hash"])
                        checks.append(
                            {
                                "tx_hash": event["tx_hash"],
                                "transaction_found": tx is not None,
                                "receipt_found": receipt is not None,
                                "verified": tx is not None and receipt is not None,
                            }
                        )
                    except Exception as exc:
                        checks.append({"tx_hash": event["tx_hash"], "verified": False, "detail": str(exc)})
                raw["provider_responses"]["alchemy_tx_verification"] = checks
                provider_status["alchemy_tx_verification"] = {"status": "ok", "checked": len(checks)}

        elif chain == "tron":
            try:
                tron_data = await self.trongrid.collect(request.address, page_size, max_pages, limit)
                wallet = tron_data.get("wallet", wallet)
                assets = tron_data.get("assets", [])
                raw["provider_responses"]["trongrid"] = tron_data.get("raw", {}).get("provider_responses", {})
                provider_status.update(tron_data.get("provider_status", {}))
                provider_status["trongrid"] = {"status": tron_data.get("status", "ok"), "records": tron_data.get("counts", {}).get("events", 0)}
                events.extend(tron_data.get("events", []))
            except Exception as exc:
                provider_status["trongrid"] = {"status": "error", "detail": str(exc)}
                errors.append(str(exc))

        else:
            raise ValueError(f"Unsupported chain '{chain}'")

        deduped = self._dedupe_events(events)
        public_transactions = [public_event(event) for event in sort_events(deduped)]
        counterparties = self._counterparties_from_events(request.address, public_transactions)
        derived = derive_features(request.address, public_transactions)

        if request.include_vasp:
            vasp_summary = await self._enrich_vasp(chain, request.address, counterparties)
        else:
            vasp_summary = {"status": "not_requested"}

        labels_map = {}
        if request.include_vasp and vasp_summary.get("status") == "ok":
            target_result = vasp_summary.get("target") or {}
            target_label = self._best_vasp_label(target_result)
            if target_label:
                labels_map[request.address.lower()] = target_label
            for address, result in (vasp_summary.get("counterparties") or {}).items():
                label = self._best_vasp_label(result)
                if label:
                    labels_map[address.lower()] = label

        graph = build_transaction_graph(request.address, public_transactions, labels_map)
        normalized = {
            "investigation_id": investigation_id,
            "wallet": strip_none(wallet),
            "transactions": public_transactions,
            "counterparties": counterparties,
            "assets": [strip_none(a.model_dump() if hasattr(a, "model_dump") else a) for a in assets],
            "counts": {
                "transactions": len(public_transactions),
                "counterparties": len(counterparties),
                "assets": len(assets),
            },
            "derived": derived,
        }

        payload = {
            "investigation_id": investigation_id,
            "address": request.address,
            "chain": chain,
            "queried_at": queried_at,
            "case_id": request.case_id,
            "complaint_id": request.complaint_id,
            "fraud_type": request.fraud_type,
            "reported_amount": request.reported_amount,
            "reported_at": request.reported_at,
            "victim_reference": request.victim_reference,
            "collection": {
                "max_records_requested": limit,
                "page_size": page_size,
                "max_pages": max_pages,
                "pagination_enabled": True,
                "deduplication_enabled": True,
                "providers": provider_status,
            },
            "wallet": strip_none(wallet),
            "normalized": normalized,
            "transactions": public_transactions,
            "counterparties": counterparties,
            "assets": normalized["assets"],
            "graph": graph,
            "derived": derived,
            "vasp": vasp_summary,
            "errors": errors,
        }

        paths = save_snapshot(
            self.settings.storage_dir,
            chain,
            investigation_id,
            raw if request.include_raw else {"raw_storage_disabled": True},
            normalized,
            graph,
            vasp_summary if request.include_vasp else {"vasp_storage_disabled": True},
        )
        payload["storage"] = paths
        try:
            payload["graph_sync"] = await get_graph_service().sync_investigation(payload)
        except Exception as exc:
            payload["graph_sync"] = {"status": "unavailable", "detail": str(exc)}
        return payload
