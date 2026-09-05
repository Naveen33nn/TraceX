# VASP Service

The VASP service is a separate enrichment module that sits on top of the chain-data collectors.
It does not collect transactions itself.

## What It Does

- checks a wallet address against label providers
- caches provider responses locally
- compares provider results
- classifies the result into a clear attribution state
- returns data that can be used in the UI and in downstream investigation logic

## Supported Providers

- MetaSleuth / BlockSec AML
- WalletExplorer
- Etherscan metadata, if the configured account has access to the nametag endpoint

## Provider Roles

### MetaSleuth

Used as a direct label provider for supported chains.
It can return entity information, categories, and attributes when the address is known.

### WalletExplorer

Used for Bitcoin clustering and wallet attribution.
This provider is especially useful when a wallet cluster exists but no named VASP label is present.
That is reported as `cluster_only`.

### Etherscan metadata

Used as a secondary EVM label source when available.
It is optional and may not be present in every environment.

## States

The service returns one explicit verdict:

- `identified`: one consensus entity is supported
- `cluster_only`: a cluster or wallet grouping is available, but no named entity is confirmed
- `conflict`: providers disagree on the entity name
- `unidentified`: no provider returned usable attribution

## Cache Behavior

Lookup results are cached per provider, chain, and address.
Cached entries expire after the configured TTL.
This keeps repeated address checks fast and reduces unnecessary API calls.

## Output Expectations

The user-facing response keeps the payload clean:

- no visible `null` values in normalized public records
- provider detail kept in the VASP section
- explicit state and consensus fields
- provider-level records preserved for auditability

## Important Boundaries

- Alchemy is not a VASP provider.
- TronGrid is not a VASP provider.
- TRON is used for blockchain data only, not label fabrication.

## How To Extend

To add another provider later:

1. Implement the provider lookup contract.
2. Return the standard provider result fields.
3. Add it to the configured provider list.
4. Let the service compare it with the existing providers.

That keeps the rest of the application unchanged.
