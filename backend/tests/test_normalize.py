from app.core.normalize import public_event


def test_public_event_drops_nulls_and_keeps_defaults():
    event = {
        "event_id": "test-1",
        "chain": "bitcoin",
        "tx_hash": "abc",
        "from_address": None,
        "to_address": None,
        "from_addresses": [None, "1from"],
        "to_addresses": [None],
        "counterparty_addresses": [None, "1cp"],
        "direction": None,
        "transaction_type": None,
        "asset": None,
        "provider": None,
        "raw": {"inner": None},
    }
    cleaned = public_event(event)
    text = str(cleaned)
    assert "None" not in text
    assert cleaned["direction"] == "unknown"
    assert cleaned["transaction_type"] == "unknown"
    assert cleaned["event_type"] == "unknown"
    assert cleaned["from_addresses"] == ["1from"]
    assert cleaned["counterparty_addresses"] == ["1cp"]
