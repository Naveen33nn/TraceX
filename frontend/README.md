# Traceboard Frontend

React and Cytoscape.js investigator workspace for SIH26183.

## Run

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to FastAPI at `http://127.0.0.1:8000`.

```powershell
npm run build
npm run test
```

The UI includes case intake, graph synchronization status, transaction evidence, a fund-flow graph, timeline, wallet/entity inspection, VASP exposure, and local filters. It uses Neo4j data when available and the normalized backend graph fallback when Neo4j is offline.
