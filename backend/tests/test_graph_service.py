from app.config import Settings
from app.graph.service import _address_key, _event_row, _vasp_rows, Neo4jGraphService


def test_graph_identities_are_chain_scoped():
    assert _address_key("ethereum", "0xABC") == "ethereum:0xabc"
    assert _address_key("polygon", "0xABC") == "polygon:0xabc"


def test_event_row_preserves_wallet_edges_and_evidence_fields():
    row = _event_row(
        "ethereum",
        {
            "event_id": "etherscan:tx-1",
            "tx_hash": "tx-1",
            "from_address": "0xAAA",
            "to_address": "0xBBB",
            "from_addresses": ["0xAAA"],
            "to_addresses": ["0xBBB"],
            "direction": "out",
            "transaction_type": "native",
            "asset": "ETH",
            "amount": "1.5",
            "provider": "etherscan",
        },
    )
    assert row["identity"] == "ethereum:tx-1:etherscan:tx-1"
    assert row["sources"][0]["identity"] == "ethereum:0xaaa"
    assert row["targets"][0]["identity"] == "ethereum:0xbbb"
    assert row["properties"]["amount"] == "1.5"


def test_vasp_rows_keep_conflicts_as_separate_entity_evidence():
    wallets, entities = _vasp_rows(
        "ethereum",
        {
            "address": "0xAAA",
            "vasp": {
                "target": {
                    "verdict": {
                        "state": "conflict",
                        "identified": False,
                        "consensus_candidates": ["Exchange A", "Exchange B"],
                        "confidence": "low",
                    },
                    "providers": [],
                }
            },
        },
    )
    assert wallets[0]["properties"]["vasp_state"] == "conflict"
    assert {row["properties"]["name"] for row in entities} == {"Exchange A", "Exchange B"}


def test_graph_service_is_safe_when_disabled():
    service = Neo4jGraphService(Settings(neo4j_enabled=False))
    assert service.configured is False
