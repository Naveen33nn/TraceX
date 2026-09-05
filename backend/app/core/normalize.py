from collections import Counter
from typing import Any

def derive_features(address: str, events: list[dict[str, Any]]) -> dict[str, Any]:
    target = address.lower()
    cps = Counter()
    by_direction = Counter()
    by_type = Counter()
    assets = Counter()
    for e in events:
        d = e.get("direction", "unknown")
        by_direction[d] += 1
        by_type[e.get("transaction_type", "unknown")] += 1
        if e.get("asset"):
            assets[e["asset"]] += 1
        for c in e.get("counterparty_addresses", []) or []:
            if c and c.lower() != target:
                cps[c] += 1
    return {
        "event_count": len(events),
        "native_and_token_event_count": len(events),
        "inbound_event_count": by_direction.get("in", 0),
        "outbound_event_count": by_direction.get("out", 0),
        "self_event_count": by_direction.get("self", 0),
        "unknown_direction_count": by_direction.get("unknown", 0),
        "unique_counterparty_count": len(cps),
        "counterparties_by_frequency": [{"address": k, "count": v} for k, v in cps.most_common()],
        "event_type_counts": dict(by_type),
        "asset_event_counts": dict(assets),
    }

def sort_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    # Newest first; stable fallback on tx hash/event id.
    return sorted(events, key=lambda e: (e.get("timestamp") or 0, e.get("tx_hash") or e.get("event_id") or ""), reverse=True)


def strip_none(value: Any) -> Any:
    if isinstance(value, dict):
        cleaned: dict[str, Any] = {}
        for key, item in value.items():
            sanitized = strip_none(item)
            if sanitized is not None:
                cleaned[key] = sanitized
        return cleaned
    if isinstance(value, list):
        cleaned_list = []
        for item in value:
            sanitized = strip_none(item)
            if sanitized is not None:
                cleaned_list.append(sanitized)
        return cleaned_list
    return value


def public_event(event: dict[str, Any]) -> dict[str, Any]:
    cleaned = strip_none(event)
    if not isinstance(cleaned, dict):
        return {}
    cleaned.setdefault("event_type", cleaned.get("transaction_type", "unknown"))
    cleaned.setdefault("from_address", "")
    cleaned.setdefault("to_address", "")
    cleaned.setdefault("from_addresses", [])
    cleaned.setdefault("to_addresses", [])
    cleaned.setdefault("counterparty_addresses", [])
    cleaned.setdefault("direction", "unknown")
    cleaned.setdefault("transaction_type", "unknown")
    cleaned.setdefault("provider", "")
    cleaned.setdefault("asset", "")
    return cleaned
