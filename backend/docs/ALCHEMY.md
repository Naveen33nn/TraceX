# Alchemy integration research

Alchemy documents two complementary classes of APIs relevant to this MVP:

1. Standard Ethereum/EVM JSON-RPC methods such as `eth_getTransactionByHash`, `eth_getTransactionReceipt`, and `eth_getBalance` for direct node-level verification.
2. Data APIs, especially `alchemy_getAssetTransfers`, `alchemy_getTokenBalances`, and `alchemy_getTokenMetadata`, for indexed wallet/asset data.

`alchemy_getAssetTransfers` supports historical transfers and returns a `pageKey` when more results remain. The collector follows that page key until pagination is exhausted, subject to configurable caps. The API covers Ethereum and supported L2s including Polygon, Base, Arbitrum and Optimism; support varies by transfer category and network.

For this MVP, Alchemy is therefore used as:

- a historical transfer enrichment source,
- a token-balance/metadata source,
- a transaction/receipt verification source,
- and a JSON-RPC supporting provider.

The core project does not require the `web3.py` package because direct JSON-RPC calls over `httpx` are sufficient, easier to audit, and avoid adding an unnecessary abstraction layer.

The VASP label system remains separate and is not mixed into the Alchemy connector.
