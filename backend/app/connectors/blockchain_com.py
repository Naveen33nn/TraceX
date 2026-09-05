from typing import Any
from app.config import Settings
from app.core.http import get_json
from app.schemas.models import NormalizedTransaction
from decimal import Decimal


class BlockchainComConnector:
    name = "blockchain_com"
    BASE = "https://blockchain.info"

    def __init__(self, settings: Settings):
        self.settings = settings

    async def fetch_address(self, address: str, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        params = {"limit": min(limit, 50), "offset": max(offset, 0)}
        # The Explorer/Data API endpoint returns the address summary and full
        # transaction objects, including inputs and outputs.
        headers = {}
        if self.settings.blockchain_com_api_key:
            headers["X-API-KEY"] = self.settings.blockchain_com_api_key
        return await get_json(
            f"{self.BASE}/rawaddr/{address}",
            params=params,
            headers=headers or None,
            timeout=self.settings.http_timeout_seconds,
        )

    @staticmethod
    def _addresses(items: list[dict[str, Any]], key: str) -> list[str]:
        result = []
        seen = set()
        for item in items or []:
            addr = item.get(key) or item.get("addr")
            if isinstance(addr, str) and addr.strip():
                a = addr.strip()
                if a not in seen:
                    seen.add(a)
                    result.append(a)
        return result

    def normalize(self, address: str, data: dict[str, Any]) -> tuple[dict[str, Any], list[NormalizedTransaction]]:
        target = address.strip()
        target_l = target.lower()
        txs: list[NormalizedTransaction] = []

        for tx in data.get("txs", []):
            inputs = tx.get("inputs") or []
            outputs = tx.get("out") or []
            input_addresses = self._addresses(inputs, "addr")
            output_addresses = self._addresses(outputs, "addr")
            from_addresses = [a for a in input_addresses if a.lower() != target_l]
            to_addresses = [a for a in output_addresses if a.lower() != target_l]
            target_in = sum(int(o.get("value", 0) or 0) for o in outputs if (o.get("addr") or "").lower() == target_l)
            target_out = sum(int(i.get("prev_out", {}).get("value", 0) or 0) for i in inputs if (i.get("prev_out", {}).get("addr") or "").lower() == target_l)

            if target_in > 0 and target_out > 0:
                direction = "self"
                counterparty = sorted(set(from_addresses + to_addresses))
                value = target_in
            elif target_in > 0:
                direction = "in"
                counterparty = from_addresses
                value = target_in
            elif target_out > 0:
                direction = "out"
                counterparty = to_addresses
                value = target_out
            else:
                direction = "unknown"
                counterparty = sorted(set(input_addresses + output_addresses))
                value = 0

            in_value = sum(int(i.get("prev_out", {}).get("value", 0) or 0) for i in inputs)
            out_value = sum(int(o.get("value", 0) or 0) for o in outputs)
            fee_raw = max(in_value - out_value, 0)
            amount_btc = Decimal(value) / Decimal(100_000_000) if value else Decimal(0)

            txs.append(NormalizedTransaction(
                event_type="bitcoin_transaction",
                event_id=f"blockchain_com:{tx.get('hash') or len(txs)}",
                chain="bitcoin",
                tx_hash=tx.get("hash"),
                block_number=tx.get("block_height"),
                timestamp=tx.get("time"),
                from_address=from_addresses[0] if from_addresses else "",
                to_address=to_addresses[0] if to_addresses else "",
                from_addresses=from_addresses,
                to_addresses=to_addresses,
                counterparty_addresses=counterparty,
                direction=direction,
                transaction_type="native",
                asset="BTC",
                amount=str(amount_btc),
                amount_raw=str(value),
                fee_raw=str(fee_raw),
                provider=self.name,
                graph_source=from_addresses[0] if from_addresses else None,
                graph_target=to_addresses[0] if to_addresses else None,
                graph_edge_type="native",
                raw=tx,
            ))

        wallet = {
            "address": data.get("address", target),
            "native_currency": "BTC",
            "native_balance": str(data.get("final_balance", 0)),
            "total_received": str(data.get("total_received", 0)),
            "total_sent": str(data.get("total_sent", 0)),
            "transaction_count": data.get("n_tx"),
        }
        return wallet, txs
