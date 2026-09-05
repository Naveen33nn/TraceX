from typing import Any
from app.core.http import get_json
from app.config import Settings
from app.schemas.models import NormalizedTransaction

class EtherscanConnector:
    name = "etherscan"
    BASE = "https://api.etherscan.io/v2/api"
    CHAIN_IDS = {"ethereum": "1", "polygon": "137"}

    def __init__(self, settings: Settings):
        self.settings = settings

    async def _call(self, action: str, address: str, chain: str, page: int, offset: int) -> dict[str, Any]:
        if not self.settings.etherscan_api_key:
            raise RuntimeError("ETHERSCAN_API_KEY is not configured")
        params = {
            "chainid": self.CHAIN_IDS[chain], "module": "account", "action": action,
            "address": address, "startblock": 0, "endblock": 999999999,
            "page": page, "offset": min(offset, 1000), "sort": "desc",
            "apikey": self.settings.etherscan_api_key,
        }
        return await get_json(self.BASE, params=params, timeout=self.settings.http_timeout_seconds)

    async def balance(self, address: str, chain: str) -> dict[str, Any]:
        if not self.settings.etherscan_api_key:
            raise RuntimeError("ETHERSCAN_API_KEY is not configured")
        return await get_json(self.BASE, params={"chainid": self.CHAIN_IDS[chain], "module": "account", "action": "balance", "address": address, "tag": "latest", "apikey": self.settings.etherscan_api_key}, timeout=self.settings.http_timeout_seconds)

    async def paginated(self, action: str, address: str, chain: str, max_records: int) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        seen: set[str] = set()
        page = 1
        offset = min(self.settings.page_size, 1000)
        while page <= self.settings.max_pages and len(rows) < max_records:
            payload = await self._call(action, address, chain, page=page, offset=offset)
            result = payload.get("result", [])
            if not isinstance(result, list) or not result:
                break
            for row in result:
                key = row.get("hash") or f"{row.get('blockNumber')}:{row.get('from')}:{row.get('to')}:{row.get('value')}:{row.get('nonce')}"
                if key not in seen:
                    seen.add(key)
                    rows.append(row)
                    if len(rows) >= max_records:
                        break
            if len(result) < offset:
                break
            page += 1
        return rows

    async def normal_transactions(self, address: str, chain: str, max_records: int) -> list[dict[str, Any]]:
        return await self.paginated("txlist", address, chain, max_records)

    async def erc20_transfers(self, address: str, chain: str, max_records: int) -> list[dict[str, Any]]:
        return await self.paginated("tokentx", address, chain, max_records)

    async def internal_transactions(self, address: str, chain: str, max_records: int) -> list[dict[str, Any]]:
        return await self.paginated("txlistinternal", address, chain, max_records)

    @staticmethod
    def _direction(address: str, frm: str | None, to: str | None) -> tuple[str, list[str]]:
        t = address.lower(); f = (frm or "").lower(); tt = (to or "").lower()
        if f == t and tt == t: return "self", []
        if f == t: return "out", [to] if to else []
        if tt == t: return "in", [frm] if frm else []
        return "unknown", [x for x in (frm, to) if x]

    def normalize_native(self, address: str, chain: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        asset = "ETH" if chain == "ethereum" else "MATIC"
        result = []
        for i, x in enumerate(rows):
            frm, to = x.get("from"), x.get("to")
            direction, cps = self._direction(address, frm, to)
            gas_used, gas_price = x.get("gasUsed"), x.get("gasPrice")
            fee = str(int(gas_used) * int(gas_price)) if str(gas_used).isdigit() and str(gas_price).isdigit() else None
            result.append(NormalizedTransaction(
                event_type="native_transfer",
                event_id=f"etherscan:{x.get('hash') or i}", chain=chain, tx_hash=x.get("hash"),
                block_number=int(x["blockNumber"]) if str(x.get("blockNumber", "")).isdigit() else None,
                timestamp=int(x["timeStamp"]) if str(x.get("timeStamp", "")).isdigit() else None,
                from_address=frm, to_address=to, from_addresses=[frm] if frm else [], to_addresses=[to] if to else [],
                counterparty_addresses=cps, direction=direction, transaction_type="native", asset=asset,
                amount=x.get("value"), amount_raw=x.get("value"), fee_raw=fee, gas_used=gas_used, gas_price=gas_price,
                gas_limit=x.get("gas"), status=x.get("txreceipt_status"), method_id=x.get("methodId"),
                function_name=x.get("functionName") or None, contract_address=x.get("contractAddress") or None,
                input_data=x.get("input"), provider=self.name, graph_source=frm, graph_target=to,
                graph_edge_type="native", raw=x
            ))
        return result

    def normalize_tokens(self, address: str, chain: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        result = []
        for i, x in enumerate(rows):
            frm, to = x.get("from"), x.get("to")
            direction, cps = self._direction(address, frm, to)
            result.append(NormalizedTransaction(
                event_type="token_transfer",
                event_id=f"etherscan-token:{x.get('hash') or i}:{x.get('logIndex') or i}", chain=chain,
                tx_hash=x.get("hash"), block_number=int(x["blockNumber"]) if str(x.get("blockNumber", "")).isdigit() else None,
                timestamp=int(x["timeStamp"]) if str(x.get("timeStamp", "")).isdigit() else None,
                from_address=frm, to_address=to, from_addresses=[frm] if frm else [], to_addresses=[to] if to else [],
                counterparty_addresses=cps, direction=direction, transaction_type="token_transfer", asset=x.get("tokenSymbol"),
                token_contract=x.get("contractAddress"), token_symbol=x.get("tokenSymbol"), token_name=x.get("tokenName"),
                token_decimals=int(x["tokenDecimal"]) if str(x.get("tokenDecimal", "")).isdigit() else None,
                amount=x.get("value"), amount_raw=x.get("value"), provider=self.name,
                graph_source=frm, graph_target=to, graph_edge_type="token_transfer", raw=x
            ))
        return result

    def normalize_internal(self, address: str, chain: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        result = []
        for i, x in enumerate(rows):
            frm, to = x.get("from"), x.get("to")
            direction, cps = self._direction(address, frm, to)
            result.append(NormalizedTransaction(
                event_type="internal_transfer",
                event_id=f"etherscan-internal:{x.get('hash') or i}:{x.get('traceId') or i}", chain=chain,
                tx_hash=x.get("hash"), block_number=int(x["blockNumber"]) if str(x.get("blockNumber", "")).isdigit() else None,
                timestamp=int(x["timeStamp"]) if str(x.get("timeStamp", "")).isdigit() else None,
                from_address=frm, to_address=to, from_addresses=[frm] if frm else [], to_addresses=[to] if to else [],
                counterparty_addresses=cps, direction=direction, transaction_type="internal", asset="ETH" if chain == "ethereum" else "MATIC",
                amount=x.get("value"), amount_raw=x.get("value"), status=x.get("isError"), provider=self.name,
                graph_source=frm, graph_target=to, graph_edge_type="internal", raw=x
            ))
        return result
