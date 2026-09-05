# Neo4j Graph Setup

The API uses the official Neo4j Python driver over Bolt. A local Neo4j installation normally listens on `bolt://127.0.0.1:7687` and provides Neo4j Browser at `http://127.0.0.1:7474`.

Set these values in `.env`:

```text
NEO4J_ENABLED=true
NEO4J_URI=bolt://127.0.0.1:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

At startup the service verifies connectivity and creates uniqueness constraints for stable investigation, wallet, transaction, entity, protocol, and chain identities. `POST /api/v1/investigate` automatically writes normalized data to Neo4j. Existing snapshots can be replayed with `POST /api/v1/graph/replay/{investigation_id}`.

Neo4j is optional during collection. If it is unavailable, transaction collection and JSON snapshot storage still complete. `graph_sync.status` reports the graph state and replay can be run after Neo4j is restored.

Searchable evidence properties are stored in Neo4j. Large raw provider payloads remain in snapshot storage.
