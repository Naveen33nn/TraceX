from typing import Any
from decimal import Decimal
from app.config import Settings
from app.core.http import post_json
from app.schemas.models import NormalizedTransaction, WalletAsset

class AlchemyConnector:
    name = "alchemy"

    URLS = {
        "ethereum": "https://eth-mainnet.g.alchemy.com/v2/{key}",
        "polygon": "https://polygon-mainnet.g.alchemy.com/v2/{key}",
    }

    def __init__(self, settings: Settings):
        self.settings = settings

    def endpoint(self, chain: str) -> str:
        if chain == "ethereum" and self.settings.alchemy_ethereum_url:
            return self.settings.alchemy_ethereum_url
        if chain == "polygon" and self.settings.alchemy_polygon_url:
            return self.settings.alchemy_polygon_url
        if not self.settings.alchemy_api_key:
            raise RuntimeError("ALCHEMY_API_KEY is not configured")
        return self.URLS[chain].format(key=self.settings.alchemy_api_key)

    async def rpc(self, chain: str, method: str, params: list[Any]) -> Any:
        body = await post_json(
            self.endpoint(chain),
            json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            timeout=self.settings.http_timeout_seconds,
        )
        if "error" in body:
            raise RuntimeError(f"Alchemy RPC error: {body['error']}")
        return body.get("result")

    async def get_asset_transfers_page(self, address: str, chain: str, page_key: str | None = None,
                                       max_count: int = 100) -> dict[str, Any]:
        params = {
            "fromBlock": "0x0",
            "toBlock": "latest",
            "fromAddress": address,
            "excludeZeroValue": True,
            "withMetadata": True,
            "category": ["external", "erc20", "erc721", "erc1155", "internal"],
            "maxCount": min(max_count, 1000),
        }
        if page_key:
            params = {"pageKey": page_key, "maxCount": min(max_count, 1000)}
        return await self.rpc(chain, "alchemy_getAssetTransfers", [params])

    async def all_asset_transfers(self, address: str, chain: str, max_records: int) -> list[dict[str, Any]]:
        # Fetch outgoing and incoming separately because the API filter is directional.
        rows: list[dict[str, Any]] = []
        seen: set[str] = set()
        for direction_key in ("fromAddress", "toAddress"):
            page_key = None
            pages = 0
            while pages < self.settings.max_pages and len(rows) < max_records:
                params = {
                    "fromBlock": "0x0",
                    "toBlock": "latest",
                    direction_key: address,
                    "excludeZeroValue": True,
                    "withMetadata": True,
                    "category": ["external", "erc20", "erc721", "erc1155", "internal"],
                    "maxCount": min(self.settings.page_size, 1000),
                }
                if page_key:
                    params = {"pageKey": page_key, "maxCount": min(self.settings.page_size, 1000)}
                result = await self.rpc(chain, "alchemy_getAssetTransfers", [params])
                transfers = result.get("transfers", []) if isinstance(result, dict) else []
                for item in transfers:
                    key = item.get("uniqueId") or f"{item.get('hash')}:{item.get('from')}:{item.get('to')}:{item.get('value')}"
                    if key not in seen:
                        seen.add(key)
                        item["_query_direction"] = "out" if direction_key == "fromAddress" else "in"
                        rows.append(item)
                        if len(rows) >= max_records:
                            break
                page_key = result.get("pageKey") if isinstance(result, dict) else None
                pages += 1
                if not page_key or not transfers:
                    break
        return rows[:max_records]

    async def token_balances(self, address: str, chain: str) -> list[WalletAsset]:
        result = await self.rpc(chain, "alchemy_getTokenBalances", [address, "erc20", {"maxCount": 100}])
        assets: list[WalletAsset] = []
        for row in (result or {}).get("tokenBalances", []):
            bal = row.get("tokenBalance")
            assets.append(WalletAsset(contract_address=row.get("contractAddress"), balance_raw=bal, provider=self.name))
        return assets

    async def token_metadata(self, chain: str, contract_address: str) -> dict[str, Any]:
        return await self.rpc(chain, "alchemy_getTokenMetadata", [contract_address])

    async def transaction_by_hash(self, chain: str, tx_hash: str) -> dict[str, Any] | None:
        return await self.rpc(chain, "eth_getTransactionByHash", [tx_hash])

    async def transaction_receipt(self, chain: str, tx_hash: str) -> dict[str, Any] | None:
        return await self.rpc(chain, "eth_getTransactionReceipt", [tx_hash])

    async def enrich_assets(self, chain: str, assets: list[WalletAsset]) -> list[WalletAsset]:
        out = []
        for asset in assets:
            if asset.contract_address:
                try:
                    meta = await self.token_metadata(chain, asset.contract_address)
                    decimals = meta.get("decimals")
                    if decimals is not None:
                        decimals = int(decimals)
                    balance = None
                    if asset.balance_raw and decimals is not None and asset.balance_raw.startswith("0x"):
                        raw_int = int(asset.balance_raw, 16)
                        balance = str(Decimal(raw_int) / (Decimal(10) ** decimals))
                    asset.name = meta.get("name")
                    asset.symbol = meta.get("symbol")
                    asset.decimals = decimals
                    asset.balance = balance
                except Exception:
                    pass
            out.append(asset)
        return out

    @staticmethod
    def normalize_transfers(address: str, chain: str, rows: list[dict[str, Any]]) -> list[NormalizedTransaction]:
        out: list[NormalizedTransaction] = []
        target = address.lower()
        for idx, x in enumerate(rows):
            frm, to = x.get("from"), x.get("to")
            frm_l = (frm or "").lower()
            to_l = (to or "").lower()
            direction = "out" if frm_l == target else ("in" if to_l == target else "unknown")
            counterparties = [p for p in {frm, to} if p and p.lower() != target]
            asset = x.get("asset")
            category = x.get("category") or "external"
            transaction_type = {
                "erc20": "token_transfer",
                "erc721": "nft_transfer",
                "erc1155": "nft_transfer",
                "internal": "internal",
            }.get(category, "native")
            out.append(NormalizedTransaction(
                event_type=transaction_type,
                event_id=f"alchemy:{x.get('uniqueId') or x.get('hash') or idx}",
                chain=chain,
                tx_hash=x.get("hash"),
                block_number=int(x["blockNum"], 16) if isinstance(x.get("blockNum"), str) and x["blockNum"].startswith("0x") else x.get("blockNum"),
                timestamp=int((x.get("metadata") or {}).get("blockTimestamp")) if str((x.get("metadata") or {}).get("blockTimestamp") or "").isdigit() else None,
                from_address=frm,
                to_address=to,
                from_addresses=[frm] if frm else [],
                to_addresses=[to] if to else [],
                counterparty_addresses=counterparties,
                direction=direction,
                transaction_type=transaction_type,
                asset=asset,
                token_contract=x.get("rawContract", {}).get("address") if isinstance(x.get("rawContract"), dict) else None,
                amount=str(x.get("value")) if x.get("value") is not None else None,
                amount_raw=x.get("rawContract", {}).get("rawValue") if isinstance(x.get("rawContract"), dict) else None,
                provider=self.name,
                graph_source=frm,
                graph_target=to,
                graph_edge_type=transaction_type,
                raw=x,
            ))
        return out
