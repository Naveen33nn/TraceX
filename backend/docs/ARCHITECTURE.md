# Architecture

## Core Flow

1. Resolve the requested chain.
2. Collect paginated transaction data from the chain-specific data provider.
3. Normalize transactions into a shared shape.
4. Derive counterparties and summary features.
5. Look up VASP labels for the target address and counterparties.
6. Compare provider results and classify the attribution state.
7. Build a graph snapshot and save the raw, normalized, graph, and VASP outputs.

## Data Providers

- Bitcoin: Blockchain.com
- Ethereum / Polygon: Etherscan, Alchemy, Infura
- TRON: TronGrid

## VASP Providers

- MetaSleuth
- WalletExplorer
- Etherscan metadata, if the configured key can access the nametag endpoint

## Output Contract

The API returns:

- the wallet address
- from/to addresses
- transaction direction
- counterparties
- normalized transactions with nulls removed from the public output
- graph-ready nodes and edges
- a VASP verdict with one of four states

## VASP States

- `identified`
- `cluster_only`
- `conflict`
- `unidentified`

## Storage

Snapshots are written under `storage/<chain>/<investigation_id>/` by default.
