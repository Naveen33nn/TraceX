from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config import Settings, get_settings

try:
    from neo4j import AsyncGraphDatabase
except ImportError:  # pragma: no cover - exercised when optional dependency is absent
    AsyncGraphDatabase = None


SCHEMA_QUERIES = (
    "CREATE CONSTRAINT investigation_identity_unique IF NOT EXISTS FOR (n:Investigation) REQUIRE n.identity IS UNIQUE",
    "CREATE CONSTRAINT wallet_identity_unique IF NOT EXISTS FOR (n:Wallet) REQUIRE n.identity IS UNIQUE",
    "CREATE CONSTRAINT transaction_identity_unique IF NOT EXISTS FOR (n:Transaction) REQUIRE n.identity IS UNIQUE",
    "CREATE CONSTRAINT entity_identity_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.identity IS UNIQUE",
    "CREATE CONSTRAINT protocol_identity_unique IF NOT EXISTS FOR (n:Protocol) REQUIRE n.identity IS UNIQUE",
    "CREATE CONSTRAINT chain_identity_unique IF NOT EXISTS FOR (n:Chain) REQUIRE n.identity IS UNIQUE",
)


def _clean(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): _clean(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [_clean(item) for item in value if item is not None]
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value) if value is not None else ""


def _address_key(chain: str, address: str) -> str:
    normalized = str(address).strip().lower()
    return f"{chain}:{normalized}"


def _tx_key(chain: str, event: dict[str, Any]) -> str:
    tx_hash = event.get("tx_hash") or event.get("event_id") or "unknown"
    event_id = event.get("event_id") or tx_hash
    return f"{chain}:{tx_hash}:{event_id}"


def _wallet_row(chain: str, address: str, *, is_target: bool = False) -> dict[str, Any]:
    address = str(address).strip()
    return {
        "identity": _address_key(chain, address),
        "properties": {
            "identity": _address_key(chain, address),
            "address": address,
            "address_normalized": address.lower(),
            "chain": chain,
            "is_target": is_target,
        },
    }


def _event_row(chain: str, event: dict[str, Any]) -> dict[str, Any]:
    tx_identity = _tx_key(chain, event)
    props = {
        "identity": tx_identity,
        "chain": chain,
        "event_id": event.get("event_id") or "",
        "tx_hash": event.get("tx_hash") or event.get("event_id") or "",
        "event_type": event.get("event_type") or event.get("transaction_type") or "unknown",
        "transaction_type": event.get("transaction_type") or "unknown",
        "direction": event.get("direction") or "unknown",
        "asset": event.get("asset") or "",
        "amount": event.get("amount") or "",
        "amount_raw": event.get("amount_raw") or "",
        "timestamp": int(event["timestamp"]) if str(event.get("timestamp", "")).isdigit() else 0,
        "block_number": int(event["block_number"]) if str(event.get("block_number", "")).isdigit() else 0,
        "provider": event.get("provider") or "",
        "hop_level": int(event.get("hop_level") or 0),
        "status": event.get("status") or "",
        "method_id": event.get("method_id") or "",
        "function_name": event.get("function_name") or "",
        "contract_address": event.get("contract_address") or event.get("token_contract") or "",
        "provenance": event.get("graph_source") or event.get("provider") or "normalized",
        "token_contract": event.get("token_contract") or "",
    }
    source_addresses = [str(item).strip() for item in event.get("from_addresses", []) if str(item).strip()]
    target_addresses = [str(item).strip() for item in event.get("to_addresses", []) if str(item).strip()]
    if event.get("from_address") and event["from_address"] not in source_addresses:
        source_addresses.append(str(event["from_address"]).strip())
    if event.get("to_address") and event["to_address"] not in target_addresses:
        target_addresses.append(str(event["to_address"]).strip())
    return {
        "identity": tx_identity,
        "properties": _clean(props),
        "sources": [_wallet_row(chain, address) for address in source_addresses],
        "targets": [_wallet_row(chain, address) for address in target_addresses],
    }


def _provider_names(result: dict[str, Any]) -> list[str]:
    names: list[str] = []
    for provider in result.get("providers", []) or []:
        name = provider.get("entity_name") or provider.get("label")
        if name and str(name).strip():
            names.append(str(name).strip())
    verdict = result.get("verdict") or {}
    names.extend(str(item).strip() for item in verdict.get("consensus_candidates", []) or [] if str(item).strip())
    if verdict.get("consensus"):
        names.append(str(verdict["consensus"]).strip())
    return list(dict.fromkeys(names))


def _vasp_rows(chain: str, payload: dict[str, Any]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    wallet_updates: list[dict[str, Any]] = []
    entities: list[dict[str, Any]] = []
    vasp = payload.get("vasp") or {}
    address_results: dict[str, dict[str, Any]] = {}
    target = vasp.get("target") or {}
    target_address = payload.get("address")
    if target_address:
        address_results[str(target_address)] = target
    address_results.update({str(address): result for address, result in (vasp.get("counterparties") or {}).items()})

    for address, result in address_results.items():
        verdict = result.get("verdict") or {}
        state = verdict.get("state") or "unidentified"
        wallet_updates.append(
            {
                "identity": _address_key(chain, address),
                "properties": {
                    "vasp_state": state,
                    "vasp_identified": bool(verdict.get("identified")),
                    "vasp_consensus": verdict.get("consensus") or "",
                    "vasp_confidence": verdict.get("confidence") or "none",
                    "cluster_only": bool(verdict.get("cluster_only")),
                },
            }
        )
        for name in _provider_names(result):
            entity_identity = f"{chain}:entity:{name.lower()}"
            entities.append(
                {
                    "identity": entity_identity,
                    "properties": {
                        "identity": entity_identity,
                        "name": name,
                        "entity_type": "vasp_or_service",
                        "chain": chain,
                        "source": "vasp_provider_comparison",
                    },
                    "wallet_identity": _address_key(chain, address),
                    "state": state,
                    "confidence": verdict.get("confidence") or "none",
                }
            )
    return wallet_updates, entities


class Neo4jGraphService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.driver = None
        self._schema_ready = False

    @property
    def configured(self) -> bool:
        return bool(self.settings.neo4j_enabled and self.settings.neo4j_uri and self.settings.neo4j_password and AsyncGraphDatabase)

    async def connect(self) -> dict[str, Any]:
        if not self.settings.neo4j_enabled:
            return {"status": "disabled", "detail": "NEO4J_ENABLED is false"}
        if AsyncGraphDatabase is None:
            return {"status": "unavailable", "detail": "neo4j package is not installed"}
        if not self.settings.neo4j_password:
            return {"status": "unavailable", "detail": "NEO4J_PASSWORD is not configured"}
        if self.driver is None:
            self.driver = AsyncGraphDatabase.driver(
                self.settings.neo4j_uri,
                auth=(self.settings.neo4j_username, self.settings.neo4j_password),
            )
        try:
            await self.driver.verify_connectivity()
            await self.ensure_schema()
            return {"status": "ok", "uri": self.settings.neo4j_uri, "database": self.settings.neo4j_database}
        except Exception as exc:
            return {"status": "unavailable", "detail": str(exc), "uri": self.settings.neo4j_uri, "database": self.settings.neo4j_database}

    async def close(self) -> None:
        if self.driver is not None:
            await self.driver.close()
            self.driver = None
            self._schema_ready = False

    async def ensure_schema(self) -> None:
        if self._schema_ready or self.driver is None:
            return
        async with self.driver.session(database=self.settings.neo4j_database) as session:
            for query in SCHEMA_QUERIES:
                await (await session.run(query)).consume()
        self._schema_ready = True

    async def status(self) -> dict[str, Any]:
        result = await self.connect()
        return {
            **result,
            "configured": bool(self.settings.neo4j_enabled),
            "driver_available": AsyncGraphDatabase is not None,
            "database": self.settings.neo4j_database,
        }

    async def sync_investigation(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.settings.neo4j_enabled:
            return {"status": "disabled", "detail": "Neo4j synchronization is disabled"}
        connection = await self.connect()
        if connection.get("status") != "ok" or self.driver is None:
            return {"status": "unavailable", "detail": connection.get("detail", "Neo4j connection failed")}

        chain = str(payload.get("chain") or "unknown")
        investigation_id = str(payload.get("investigation_id") or "")
        if not investigation_id:
            return {"status": "error", "detail": "investigation_id is required"}
        events = list((payload.get("normalized") or {}).get("transactions") or payload.get("transactions") or [])
        event_rows = [_event_row(chain, event) for event in events]
        wallet_rows: dict[str, dict[str, Any]] = {}
        for row in event_rows:
            for wallet in row["sources"] + row["targets"]:
                wallet_rows[wallet["identity"]] = wallet
        target = str(payload.get("address") or (payload.get("normalized") or {}).get("wallet", {}).get("address") or "")
        if target:
            target_row = _wallet_row(chain, target, is_target=True)
            wallet_rows[target_row["identity"]] = target_row
        vasp_wallets, entity_rows = _vasp_rows(chain, payload)
        for update in vasp_wallets:
            if update["identity"] in wallet_rows:
                wallet_rows[update["identity"]]["properties"].update(update["properties"])
            else:
                wallet_rows[update["identity"]] = {"identity": update["identity"], "properties": update["properties"]}

        investigation_props = {
            "identity": investigation_id,
            "investigation_id": investigation_id,
            "address": target,
            "chain": chain,
            "queried_at": payload.get("queried_at") or datetime.now(timezone.utc).isoformat(),
            "case_id": payload.get("case_id") or "",
            "complaint_id": payload.get("complaint_id") or "",
            "fraud_type": payload.get("fraud_type") or "",
            "reported_amount": payload.get("reported_amount") or "",
            "reported_at": payload.get("reported_at") or "",
            "victim_reference": payload.get("victim_reference") or "",
        }
        graph_rows = min(len(wallet_rows) + len(event_rows) + len(entity_rows), self.settings.neo4j_max_nodes)

        async with self.driver.session(database=self.settings.neo4j_database) as session:
            result = await session.execute_write(
                self._write_investigation,
                investigation_props,
                chain,
                list(wallet_rows.values())[: self.settings.neo4j_max_nodes],
                event_rows[: self.settings.neo4j_max_nodes],
                entity_rows[: self.settings.neo4j_max_nodes],
            )
        return {
            "status": "ok",
            "investigation_id": investigation_id,
            "database": self.settings.neo4j_database,
            "nodes_seen": graph_rows,
            "wallets_seen": len(wallet_rows),
            "transactions_seen": len(event_rows),
            "entities_seen": len(entity_rows),
            **result,
        }

    async def _write_investigation(
        self,
        tx: Any,
        investigation_props: dict[str, Any],
        chain: str,
        wallets: list[dict[str, Any]],
        events: list[dict[str, Any]],
        entities: list[dict[str, Any]],
    ) -> dict[str, int]:
        counters = {"nodes_created": 0, "relationships_created": 0, "properties_set": 0}
        queries = [
            (
                """
                MERGE (i:Investigation {identity: $investigation_identity})
                SET i += $props
                MERGE (c:Chain {identity: $chain})
                SET c.name = $chain
                MERGE (i)-[:ON_CHAIN]->(c)
                """,
                {"props": investigation_props, "investigation_identity": investigation_props["identity"], "chain": chain},
            ),
            (
                """
                UNWIND $wallets AS row
                MERGE (w:Wallet {identity: row.identity})
                SET w += row.properties
                """,
                {"wallets": wallets},
            ),
            (
                """
                UNWIND $events AS row
                MERGE (t:Transaction {identity: row.identity})
                SET t += row.properties
                WITH t, row
                MATCH (i:Investigation {identity: $investigation_id})
                MERGE (i)-[:OBSERVED]->(t)
                FOREACH (source IN row.sources |
                    MERGE (w:Wallet {identity: source.identity})
                    MERGE (w)-[:SOURCE_OF]->(t)
                )
                FOREACH (target IN row.targets |
                    MERGE (w:Wallet {identity: target.identity})
                    MERGE (t)-[:DESTINATION_OF]->(w)
                )
                """,
                {"events": events, "investigation_id": investigation_props["identity"]},
            ),
            (
                """
                MATCH (i:Investigation {identity: $investigation_id})
                UNWIND $wallets AS row
                MATCH (w:Wallet {identity: row.identity})
                MERGE (i)-[:CONTAINS]->(w)
                """,
                {"wallets": wallets, "investigation_id": investigation_props["identity"]},
            ),
            (
                """
                UNWIND $entities AS row
                MERGE (e:Entity {identity: row.identity})
                SET e += row.properties
                WITH e, row
                MATCH (w:Wallet {identity: row.wallet_identity})
                MERGE (w)-[r:EXPOSED_TO]->(e)
                SET r.state = row.state, r.confidence = row.confidence
                """,
                {"entities": entities},
            ),
            (
                """
                UNWIND $wallets AS row
                MATCH (w:Wallet {identity: row.identity})
                MATCH (c:Chain {identity: $chain})
                MERGE (w)-[:ON_CHAIN]->(c)
                """,
                {"wallets": wallets, "chain": chain},
            ),
            (
                """
                UNWIND $events AS row
                WITH row WHERE row.properties.contract_address <> ''
                MERGE (p:Protocol {identity: $protocol_prefix + toLower(row.properties.contract_address)})
                SET p.address = row.properties.contract_address, p.chain = $chain, p.type = row.properties.transaction_type
                MATCH (t:Transaction {identity: row.identity})
                MATCH (w:Wallet)-[:SOURCE_OF|DESTINATION_OF]-(t)
                MERGE (w)-[:INTERACTED_WITH]->(p)
                """,
                {"events": events, "chain": chain, "protocol_prefix": f"{chain}:protocol:"},
            ),
        ]
        for query, params in queries:
            if not params.get("wallets") and "UNWIND $wallets" in query:
                continue
            if not params.get("events") and "UNWIND $events" in query:
                continue
            if not params.get("entities") and "UNWIND $entities" in query:
                continue
            summary = await (await tx.run(query, **params)).consume()
            counters["nodes_created"] += summary.counters.nodes_created
            counters["relationships_created"] += summary.counters.relationships_created
            counters["properties_set"] += summary.counters.properties_set
        return counters

    async def investigation_graph(self, investigation_id: str, max_nodes: int = 10000) -> dict[str, Any]:
        if not self.settings.neo4j_enabled:
            return {"status": "disabled", "nodes": [], "edges": []}
        connection = await self.connect()
        if connection.get("status") != "ok" or self.driver is None:
            return {"status": "unavailable", "detail": connection.get("detail", "Neo4j connection failed"), "nodes": [], "edges": []}
        async with self.driver.session(database=self.settings.neo4j_database) as session:
            nodes_result = await session.run(
                """
                MATCH (i:Investigation {identity: $investigation_id})
                OPTIONAL MATCH (i)-[:OBSERVED|CONTAINS]->(n)
                OPTIONAL MATCH (i)-[:CONTAINS]->(w:Wallet)-[:EXPOSED_TO]->(e:Entity)
                WITH collect(DISTINCT i) + collect(DISTINCT n) + collect(DISTINCT e) AS node_list
                UNWIND node_list AS node
                RETURN DISTINCT labels(node)[0] AS type, properties(node) AS properties
                LIMIT $max_nodes
                """,
                investigation_id=investigation_id,
                max_nodes=max_nodes,
            )
            nodes = [{"type": record["type"], **dict(record["properties"])} async for record in nodes_result]
            edge_result = await session.run(
                """
                MATCH (i:Investigation {identity: $investigation_id})-[:OBSERVED]->(t:Transaction)
                OPTIONAL MATCH (w:Wallet)-[sr:SOURCE_OF]->(t)
                OPTIONAL MATCH (t)-[dr:DESTINATION_OF]->(d:Wallet)
                OPTIONAL MATCH (w)-[er:EXPOSED_TO]->(e:Entity)
                RETURN collect(DISTINCT {source: i.identity, target: t.identity, type: 'OBSERVED', properties: {}})
                    + collect(DISTINCT CASE WHEN w IS NULL THEN null ELSE {source: w.identity, target: t.identity, type: type(sr), properties: properties(sr)} END)
                    + collect(DISTINCT CASE WHEN d IS NULL THEN null ELSE {source: t.identity, target: d.identity, type: type(dr), properties: properties(dr)} END)
                    + collect(DISTINCT CASE WHEN e IS NULL THEN null ELSE {source: w.identity, target: e.identity, type: type(er), properties: properties(er)} END) AS edge_list
                """,
                investigation_id=investigation_id,
            )
            edge_record = await edge_result.single()
            edges = [dict(edge) for edge in (edge_record["edge_list"] if edge_record else []) if edge]
        return {"status": "ok", "investigation_id": investigation_id, "nodes": nodes, "edges": edges, "node_count": len(nodes), "edge_count": len(edges)}

    async def neighbors(self, chain: str, address: str, depth: int, max_nodes: int) -> dict[str, Any]:
        if not self.settings.neo4j_enabled:
            return {"status": "disabled", "nodes": [], "edges": []}
        connection = await self.connect()
        if connection.get("status") != "ok" or self.driver is None:
            return {"status": "unavailable", "detail": connection.get("detail", "Neo4j connection failed"), "nodes": [], "edges": []}
        identity = _address_key(chain, address)
        depth = max(1, min(depth, 10))
        async with self.driver.session(database=self.settings.neo4j_database) as session:
            nodes_result = await session.run(
                f"""
                MATCH p=(start:Wallet {{identity: $identity}})-[*1..{depth}]-(node)
                UNWIND nodes(p) AS n
                RETURN DISTINCT labels(n)[0] AS type, properties(n) AS properties
                LIMIT $max_nodes
                """,
                identity=identity,
                max_nodes=max_nodes,
            )
            nodes = [{"type": record["type"], **dict(record["properties"])} async for record in nodes_result]
            edge_result = await session.run(
                f"""
                MATCH p=(start:Wallet {{identity: $identity}})-[*1..{depth}]-(node)
                UNWIND relationships(p) AS rel
                RETURN DISTINCT startNode(rel).identity AS source, endNode(rel).identity AS target,
                    type(rel) AS type, properties(rel) AS properties
                LIMIT $max_relationships
                """,
                identity=identity,
                max_relationships=self.settings.neo4j_max_relationships,
            )
            edges = [{"source": record["source"], "target": record["target"], "type": record["type"], "properties": dict(record["properties"])} async for record in edge_result]
        return {"status": "ok", "root": identity, "nodes": nodes, "edges": edges, "node_count": len(nodes), "edge_count": len(edges)}

    async def path(self, chain: str, source: str, target: str, max_depth: int) -> dict[str, Any]:
        if not self.settings.neo4j_enabled:
            return {"status": "disabled", "nodes": [], "edges": []}
        connection = await self.connect()
        if connection.get("status") != "ok" or self.driver is None:
            return {"status": "unavailable", "detail": connection.get("detail", "Neo4j connection failed"), "nodes": [], "edges": []}
        max_depth = max(1, min(max_depth, 10))
        async with self.driver.session(database=self.settings.neo4j_database) as session:
            result = await session.run(
                f"""
                MATCH p=shortestPath((source:Wallet {{identity: $source}})-[*..{max_depth}]-(target:Wallet {{identity: $target}}))
                UNWIND nodes(p) AS n
                RETURN collect(DISTINCT {{type: labels(n)[0], properties: properties(n)}}) AS nodes,
                    [rel IN relationships(p) | {{source: startNode(rel).identity, target: endNode(rel).identity, type: type(rel), properties: properties(rel)}}] AS edges
                """,
                source=_address_key(chain, source),
                target=_address_key(chain, target),
            )
            record = await result.single()
        if record is None:
            return {"status": "not_found", "nodes": [], "edges": []}
        nodes = [{"type": item["type"], **dict(item["properties"])} for item in record["nodes"]]
        return {"status": "ok", "nodes": nodes, "edges": [dict(edge) for edge in record["edges"]], "node_count": len(nodes), "edge_count": len(record["edges"])}


_service: Neo4jGraphService | None = None


def get_graph_service() -> Neo4jGraphService:
    global _service
    if _service is None:
        _service = Neo4jGraphService(get_settings())
    return _service


def snapshot_path(root_dir: str | Path, investigation_id: str, chain: str = "") -> Path | None:
    root = Path(root_dir)
    if chain:
        candidate = root / chain / investigation_id / "normalized" / "normalized.json"
        return candidate if candidate.exists() else None
    for candidate in root.glob(f"*/{investigation_id}/normalized/normalized.json"):
        if candidate.exists():
            return candidate
    return None
