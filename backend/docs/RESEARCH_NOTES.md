# API Research Notes

## Summary

This project uses chain-data providers and label providers as separate layers.
The collection layer gathers transactions, balances, and transfer history.
The VASP layer performs attribution and comparison without changing the chain-data pipeline.

## Etherscan

Current docs show Etherscan V2 as a unified onchain data API with many EVM chains selected using `chainid`.
The API exposes balances, normal transactions, ERC-20 transfers, internal transactions, and address metadata.

Relevant endpoints:

- `balance`
- `txlist`
- `tokentx`
- `txlistinternal`
- metadata and tags where plan access permits

## Bitquery

Current docs describe V2 as GraphQL over `https://streaming.bitquery.io/graphql` with Bearer authentication.
EVM datasets include transactions, transfers, balances, token holders, events, DEX trades, calls, and more.
Bitcoin support includes transactions, addresses, inputs and outputs, fees, and Coinpath.

## Infura

Current docs describe managed blockchain APIs and JSON-RPC access.
It is excellent for direct chain state and RPC verification but is not a substitute for an indexed address-history API.

## Blockchain.com

Current developer docs expose Bitcoin address and transaction data, including the legacy `rawaddr/$address` route with summary fields and transaction arrays.
The query API states Bitcoin amounts are in satoshis.
The provider also exposes WebSocket subscriptions for real-time Bitcoin notifications.

## WalletExplorer

The public API supports address lookup and wallet lookup without an API key.
It is useful for Bitcoin clustering because it can return a wallet cluster even when no named entity label is available.
That is why the service treats it as `cluster_only` when appropriate.

## MetaSleuth / BlockSec AML

The documented address-label API is a direct attribution service.
It accepts a chain ID and address, then returns entity information, categories, and attributes when coverage exists.
This is the primary label source for EVM, Bitcoin, and TRON addresses in the new VASP layer.

## TronGrid / TRON

TronGrid provides chain data, not VASP attribution.
It is used for TRON account and transfer history only.
Pagination is fingerprint-based, which makes it suitable for a data layer but not a label layer.

## Design Conclusion

Use:

- Blockchain.com -> Bitcoin basic history
- Etherscan -> Ethereum and Polygon indexed account history
- Infura -> RPC verification
- Bitquery -> optional rich multi-chain enrichment
- WalletExplorer -> Bitcoin cluster attribution
- MetaSleuth -> label comparison and enrichment
- TronGrid -> TRON transaction data

Do not duplicate every request across every provider.
One provider should be primary for each layer; the second provider should verify or enrich selected fields.
