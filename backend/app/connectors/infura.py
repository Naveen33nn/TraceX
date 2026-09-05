from typing import Any
import httpx
from app.config import Settings

class InfuraConnector:
    name = "infura"
    def __init__(self, settings: Settings): self.settings = settings
    def endpoint(self, chain: str) -> str:
        if chain == "ethereum" and self.settings.infura_ethereum_url: return self.settings.infura_ethereum_url
        if chain == "polygon" and self.settings.infura_polygon_url: return self.settings.infura_polygon_url
        if self.settings.infura_project_id:
            host = "mainnet.infura.io" if chain == "ethereum" else "polygon-mainnet.infura.io"
            return f"https://{host}/v3/{self.settings.infura_project_id}"
        raise RuntimeError("Infura endpoint/project ID is not configured")
    async def rpc(self, chain: str, method: str, params: list[Any]) -> Any:
        async with httpx.AsyncClient(timeout=self.settings.http_timeout_seconds) as client:
            r = await client.post(self.endpoint(chain), json={"jsonrpc":"2.0","method":method,"params":params,"id":1})
            r.raise_for_status(); body = r.json()
        if "error" in body: raise RuntimeError(f"Infura RPC error: {body['error']}")
        return body.get("result")
    async def native_balance(self, chain: str, address: str) -> str: return await self.rpc(chain, "eth_getBalance", [address, "latest"])
    async def latest_block(self, chain: str) -> str: return await self.rpc(chain, "eth_blockNumber", [])
