from typing import Any

def build_transaction_graph(
    address: str,
    events: list[dict[str, Any]],
    address_labels: dict[str, str] | None = None,
) -> dict[str, Any]:
    target = address.lower()
    nodes: dict[str, dict[str, Any]] = {}
    edges: list[dict[str, Any]] = []
    labels = {k.lower(): v for k, v in (address_labels or {}).items() if k and v}

    def add_address(addr: str):
        if not addr:
            return
        key = f"address:{addr.lower()}"
        nodes.setdefault(
            key,
            {
                "id": key,
                "type": "address",
                "address": addr,
                "is_target": addr.lower() == target,
                "label": labels.get(addr.lower(), addr),
            },
        )

    for event in events:
        tx_hash = event.get("tx_hash") or event.get("event_id")
        if not tx_hash:
            continue
        tx_id = f"tx:{tx_hash}:{event.get('event_id', '')}"
        nodes.setdefault(tx_id, {
            "id": tx_id, "type": "transaction", "tx_hash": event.get("tx_hash"),
            "event_id": event.get("event_id"), "event_type": event.get("transaction_type"),
            "asset": event.get("asset"), "amount": event.get("amount"), "timestamp": event.get("timestamp"),
        })
        froms = event.get("from_addresses") or ([event.get("from_address")] if event.get("from_address") else [])
        tos = event.get("to_addresses") or ([event.get("to_address")] if event.get("to_address") else [])
        for src in froms:
            if src:
                add_address(src)
                edges.append({"source": f"address:{src.lower()}", "target": tx_id, "type": "source", "edge_type": event.get("transaction_type")})
        for dst in tos:
            if dst:
                add_address(dst)
                edges.append({"source": tx_id, "target": f"address:{dst.lower()}", "type": "target", "edge_type": event.get("transaction_type")})

    return {"nodes": list(nodes.values()), "edges": edges, "node_count": len(nodes), "edge_count": len(edges)}
