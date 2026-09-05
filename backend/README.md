# SIH26183 Crypto Fraud Attribution Backend

FastAPI data and graph backend for SIH26183, Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges.

The backend collects paginated data from Blockchain.com, Etherscan V2, Alchemy, Infura, and TronGrid; normalizes wallet and transaction evidence; enriches addresses through swappable MetaSleuth, WalletExplorer, and Etherscan metadata providers; and automatically projects normalized results into Neo4j.

Alchemy and TronGrid are blockchain data providers only. VASP attribution is evidence-based enrichment and is not legal identity.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Configure provider keys and Neo4j credentials in `.env`. See [docs/NEO4J.md](docs/NEO4J.md).

Start the API:

```powershell
python -m uvicorn app.main:app --reload
```

API documentation: `http://127.0.0.1:8000/docs`.

## Graph API

- `POST /api/v1/investigate` collects data and automatically syncs Neo4j.
- `POST /api/v1/graph/sync` syncs a payload or stored investigation.
- `POST /api/v1/graph/replay/{investigation_id}` replays a snapshot including VASP data.
- `GET /api/v1/graph/status` checks Neo4j without exposing credentials.
- `GET /api/v1/graph/{investigation_id}` returns graph nodes and relationships.
- `GET /api/v1/graph/neighbors` returns bounded graph neighbors.
- `GET /api/v1/graph/path` returns a bounded shortest path.

## Verification

```powershell
python -m pytest -q
python -m compileall -q app
```

The separate React application is in `C:\Users\Pavan\Desktop\SIH_BLOCK_CHAIN\frontend`.
