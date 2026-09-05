from __future__ import annotations

from decimal import Decimal
from typing import Any

from app.config import Settings
from app.core.http import get_json, post_json
from app.schemas.models import NormalizedTransaction


class TronGridConnector:
    name = "trongrid"

    def __init__(self, settings: Settings):
        self.settings = settings

    def _base(self) -> str:
        return self.settings.tron_data_base_url.rstrip("/")

    def _headers(self) -> dict[str, str] | None:
        if not self.settings.tron_api_key:
            return None
        return {"TRON-PRO-API-KEY": self.settings.tron_api_key}

    async def account_info(self, address: str) -> dict[str, Any]:
        # TronGrid exposes account state through the node / wallet API.
        return await post_json(
            f"{self._base()}/wallet/getaccount",
            json={"address": address, "visible": True},
            headers=self._headers(),
            timeout=self.settings.http_timeout_seconds,
        )

    async def _paginate(
        self,
        path: str,
        address: str,
        *,
        limit: int,
        max_pages: int,
        max_records: int,
        extra_params: dict[str, Any] | None = None,
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        fingerprint: str | None = None
        last_body: dict[str, Any] = {}
        for _ in range(max_pages):
            params: dict[str, Any] = {
                "limit": min(limit, 200),
                "only_confirmed": "true",
                "order_by": "block_timestamp,desc",
            }
            if extra_params:
                params.update(extra_params)
            if fingerprint:
                params["fingerprint"] = fingerprint
            body = await get_json(
                f"{self._base()}{path.format(address=address)}",
                params=params,
                headers=self._headers(),
                timeout=self.settings.http_timeout_seconds,
            )
            items = body.get("data") or body.get("transactions") or body.get("result") or []
            if not isinstance(items, list):
                items = []
            rows.extend(items)
            last_body = body
            fingerprint = (body.get("meta") or {}).get("fingerprint")
            if len(items) < params["limit"] or not fingerprint or len(rows) >= max_records:
                break
        return rows[:max_records], last_body

    @staticmethod
    def _direction(target: str, source: str | None, dest: str | None) -> tuple[str, list[str]]:
        t = target.lower()
        s = (source or "").lower()
        d = (dest or "").lower()
        if s == t and d == t:
            return "self", []
        if s == t:
            return "out", [dest] if dest else []
        if d == t:
            return "in", [source] if source else []
        parties = [x for x in (source, dest) if x]
        return "unknown", parties

    @staticmethod
    def _sun_to_trx(raw_value: Any) -> str | None:
        try:
            return str(Decimal(str(raw_value)) / Decimal(1_000_000))
        except Exception:
            return None

    @staticmethod
    def _maybe_int(value: Any) -> int | None:
        try:
            return int(value)
        except Exception:
            return None

    @staticmethod
    def _first_contract(transaction: dict[str, Any]) -> tuple[str | None, dict[str, Any], dict[str, Any]]:
        raw_data = transaction.get("raw_data") or {}
        contracts = raw_data.get("contract") or []
        contract = contracts[0] if contracts else {}
        parameter = contract.get("parameter") or {}
        value = parameter.get("value") or {}
        return contract.get("type"), parameter, value

    def normalize_trx(self, address: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        target = address.strip()
        target_l = target.lower()
        out: list[NormalizedTransaction] = []
        for idx, item in enumerate(rows):
            txid = item.get("txID") or item.get("txid") or item.get("transaction_id") or item.get("hash") or f"tron-tx-{idx}"
            tx_type, parameter, value = self._first_contract(item)
            source = value.get("owner_address") or item.get("owner_address") or item.get("from")
            dest = value.get("to_address") or item.get("to_address") or item.get("to")
            direction, counterparties = self._direction(target, source, dest)
            amount_raw = value.get("amount") or item.get("amount") or item.get("value")
            asset = "TRX" if tx_type == "TransferContract" else (value.get("asset_name") or item.get("asset_name") or "TRC10")
            amount = self._sun_to_trx(amount_raw) if tx_type == "TransferContract" else (str(amount_raw) if amount_raw is not None else None)
            if source and source.lower() == target_l:
                from_addresses = [source]
            elif source:
                from_addresses = [source]
            else:
                from_addresses = []
            if dest and dest.lower() == target_l:
                to_addresses = [dest]
            elif dest:
                to_addresses = [dest]
            else:
                to_addresses = []
            out.append(
                NormalizedTransaction(
                    event_type="tron_transfer",
                    event_id=f"trongrid:{txid}",
                    chain="tron",
                    tx_hash=txid,
                    block_number=self._maybe_int(item.get("blockNumber") or item.get("block_number")),
                    timestamp=self._maybe_int(item.get("block_timestamp") or item.get("blockTimestamp") or item.get("timestamp")),
                    from_address=source or "",
                    to_address=dest or "",
                    from_addresses=from_addresses,
                    to_addresses=to_addresses,
                    counterparty_addresses=counterparties,
                    direction=direction,
                    transaction_type="native" if tx_type == "TransferContract" else "token_transfer",
                    asset=asset,
                    token_contract=value.get("token_contract") or item.get("contract_address") or item.get("contractAddress"),
                    token_symbol=value.get("symbol") or item.get("symbol") or asset,
                    token_name=item.get("token_name") or item.get("tokenName"),
                    token_decimals=self._maybe_int(value.get("decimals") or item.get("decimals")),
                    amount=amount,
                    amount_raw=str(amount_raw) if amount_raw is not None else None,
                    status=str(item.get("ret") or item.get("status") or ""),
                    provider=self.name,
                    graph_source=source,
                    graph_target=dest,
                    graph_edge_type="native" if tx_type == "TransferContract" else "token_transfer",
                    raw=item,
                )
            )
        return out

    def normalize_trc20(self, address: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        target = address.strip()
        target_l = target.lower()
        out: list[NormalizedTransaction] = []
        for idx, item in enumerate(rows):
            txid = item.get("transaction_id") or item.get("txID") or item.get("hash") or f"tron-trc20-{idx}"
            source = item.get("from") or item.get("sender")
            dest = item.get("to") or item.get("receiver")
            direction, counterparties = self._direction(target, source, dest)
            token_info = item.get("token_info") or {}
            token_contract = token_info.get("address") or item.get("contract_address") or item.get("contractAddress")
            token_symbol = token_info.get("symbol") or item.get("symbol") or item.get("token_symbol") or "TRC20"
            token_name = token_info.get("name") or item.get("token_name") or item.get("tokenName")
            decimals = token_info.get("decimals") if token_info.get("decimals") is not None else item.get("decimals")
            amount_raw = item.get("value") or item.get("amount") or item.get("quantity")
            amount = None
            try:
                if decimals is not None:
                    amount = str(Decimal(str(amount_raw)) / (Decimal(10) ** Decimal(str(decimals))))
                elif amount_raw is not None:
                    amount = str(amount_raw)
            except Exception:
                amount = str(amount_raw) if amount_raw is not None else None
            out.append(
                NormalizedTransaction(
                    event_type="trc20_transfer",
                    event_id=f"trongrid-trc20:{txid}:{idx}",
                    chain="tron",
                    tx_hash=txid,
                    block_number=self._maybe_int(item.get("blockNumber") or item.get("block_number")),
                    timestamp=self._maybe_int(item.get("block_timestamp") or item.get("timestamp") or item.get("blockTimeStamp")),
                    from_address=source or "",
                    to_address=dest or "",
                    from_addresses=[source] if source else [],
                    to_addresses=[dest] if dest else [],
                    counterparty_addresses=counterparties,
                    direction=direction,
                    transaction_type="token_transfer",
                    asset=token_symbol,
                    token_contract=token_contract,
                    token_symbol=token_symbol,
                    token_name=token_name,
                    token_decimals=self._maybe_int(decimals),
                    amount=amount,
                    amount_raw=str(amount_raw) if amount_raw is not None else None,
                    provider=self.name,
                    graph_source=source,
                    graph_target=dest,
                    graph_edge_type="token_transfer",
                    raw=item,
                )
            )
        return out

    async def collect(self, address: str, page_size: int, max_pages: int, max_records: int) -> dict[str, Any]:
        wallet: dict[str, Any] = {
            "address": address,
            "chain": "tron",
            "native_currency": "TRX",
        }
        raw: dict[str, Any] = {"provider_responses": {}}
        events: list[dict[str, Any]] = []
        assets: list[dict[str, Any]] = []
        provider_status: dict[str, Any] = {}

        try:
            account = await self.account_info(address)
            raw["provider_responses"]["trongrid_account"] = account
            provider_status["trongrid_account"] = {"status": "ok"}
            balance = account.get("balance")
            if balance is not None:
                wallet["native_balance_raw"] = str(balance)
                wallet["native_balance"] = self._sun_to_trx(balance)
            if account.get("account_name"):
                wallet["account_name"] = account.get("account_name")
        except Exception as exc:
            provider_status["trongrid_account"] = {"status": "error", "detail": str(exc)}

        try:
            trx_rows, trx_body = await self._paginate(
                "/v1/accounts/{address}/transactions",
                address,
                limit=page_size,
                max_pages=max_pages,
                max_records=max_records,
            )
            raw["provider_responses"]["trongrid_transactions"] = trx_rows
            raw["provider_responses"]["trongrid_transactions_page"] = trx_body
            provider_status["trongrid_transactions"] = {"status": "ok", "records": len(trx_rows)}
            events.extend([e.model_dump() for e in self.normalize_trx(address, trx_rows)])
        except Exception as exc:
            provider_status["trongrid_transactions"] = {"status": "error", "detail": str(exc)}

        try:
            trc20_rows, trc20_body = await self._paginate(
                "/v1/accounts/{address}/transactions/trc20",
                address,
                limit=page_size,
                max_pages=max_pages,
                max_records=max_records,
            )
            raw["provider_responses"]["trongrid_trc20"] = trc20_rows
            raw["provider_responses"]["trongrid_trc20_page"] = trc20_body
            provider_status["trongrid_trc20"] = {"status": "ok", "records": len(trc20_rows)}
            events.extend([e.model_dump() for e in self.normalize_trc20(address, trc20_rows)])
        except Exception as exc:
            provider_status["trongrid_trc20"] = {"status": "error", "detail": str(exc)}

        deduped: list[dict[str, Any]] = []
        seen: set[str] = set()
        for event in events:
            key = event.get("event_id") or event.get("tx_hash") or f"{event.get('chain')}:{event.get('timestamp')}:{event.get('from_address')}:{event.get('to_address')}"
            if key in seen:
                continue
            seen.add(key)
            deduped.append(event)

        return {
            "status": "ok" if events else "partial",
            "provider": self.name,
            "counts": {
                "trx": len(raw["provider_responses"].get("trongrid_transactions", [])),
                "trc20": len(raw["provider_responses"].get("trongrid_trc20", [])),
                "events": len(deduped),
            },
            "wallet": wallet,
            "events": deduped,
            "assets": assets,
            "provider_status": provider_status,
            "raw": raw,
        }
