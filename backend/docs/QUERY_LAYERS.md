# Query Layers

This project is organized as two cooperating layers:

1. A transaction and balance collection layer.
2. A separate VASP enrichment and comparison layer.

The split is intentional. It keeps the transaction pipeline stable even if label providers change later.

## Collection Layer

### Bitcoin

- Primary provider: Blockchain.com
- Main route: `rawaddr/{address}`
- Pagination: `limit` and `offset`
- Why: it returns address-level history, summary fields, and transaction arrays in a format that is easy to normalize.

Collected fields include:

- wallet address
- transaction hash
- inputs and outputs
- from/to addresses
- direction
- fees
- balances and totals

### Ethereum and Polygon

- Primary provider: Etherscan V2
- Secondary data provider: Alchemy
- Verification provider: Infura

Etherscan V2 supplies indexed address history with pagination:

- `txlist`
- `tokentx`
- `txlistinternal`
- `balance`

Alchemy adds richer transfer coverage and can verify selected hashes with JSON-RPC.
Infura is used as a direct node-level balance and transaction verification source.

Collected fields include:

- wallet address
- native transactions
- ERC-20 transfers
- internal transfers
- from/to addresses
- transaction direction
- token metadata
- counterparties
- receipt and balance verification

### TRON

- Primary provider: TronGrid
- Data only, not VASP

TronGrid supplies account and transfer history through paginated account endpoints.
It is used for:

- TRX and TRC10 style account transactions
- TRC20 transfers
- account state and balances when available

Collected fields include:

- wallet address
- from/to addresses
- transaction direction
- counterparties
- token and contract details

## Normalization Layer

All providers are converted into one shared event shape.
The public normalized output is cleaned so user-facing records do not show `null` values.

Each normalized event aims to expose:

- `event_id`
- `chain`
- `tx_hash`
- `from_address`
- `to_address`
- `direction`
- `transaction_type`
- `asset`
- `counterparty_addresses`
- provider metadata
- graph hints

The investigation service deduplicates records, sorts them newest-first, and derives counterparty frequency summaries from the normalized output.

## VASP Layer

The VASP layer is separate from collection.

Current providers:

- MetaSleuth / BlockSec AML
- WalletExplorer
- Etherscan metadata, when configured and available

The VASP layer is responsible for:

- address lookup
- label comparison
- cache reuse
- state classification
- consensus building

It returns one of four explicit states:

- `identified`
- `cluster_only`
- `conflict`
- `unidentified`

## Why This Split Matters

This design lets the project:

- keep transaction collection working even if label providers fail
- swap in or remove VASP providers later
- avoid repeating expensive lookup calls
- preserve the same transaction graph and investigation flow across chains
