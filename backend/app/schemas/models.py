from typing import Any
from pydantic import BaseModel, Field

class InvestigationRequest(BaseModel):
    address: str = Field(min_length=1)
    chain: str = "auto"
    case_id: str = ""
    complaint_id: str = ""
    fraud_type: str = ""
    reported_amount: str = ""
    reported_at: str = ""
    victim_reference: str = ""
    max_records: int | None = Field(default=None, ge=1, le=10000)
    page_size: int | None = Field(default=None, ge=1, le=1000)
    max_pages: int | None = Field(default=None, ge=1, le=500)
    include_raw: bool = True
    include_vasp: bool = True
    force_refresh: bool = False


class VASPCheckRequest(BaseModel):
    address: str = Field(min_length=1)
    chain: str = "auto"
    force_refresh: bool = False


class GraphSyncRequest(BaseModel):
    investigation_id: str = ""
    chain: str = ""
    payload: dict[str, Any] | None = None

class NormalizedTransaction(BaseModel):
    event_type: str | None = None
    event_id: str
    chain: str
    tx_hash: str | None = None
    block_number: int | None = None
    timestamp: int | None = None
    from_address: str | None = None
    to_address: str | None = None
    from_addresses: list[str] = Field(default_factory=list)
    to_addresses: list[str] = Field(default_factory=list)
    counterparty_addresses: list[str] = Field(default_factory=list)
    direction: str = "unknown"
    transaction_type: str = "native"
    asset: str | None = None
    token_contract: str | None = None
    token_symbol: str | None = None
    token_name: str | None = None
    token_decimals: int | None = None
    amount: str | None = None
    amount_raw: str | None = None
    fee_raw: str | None = None
    gas_used: str | None = None
    gas_price: str | None = None
    gas_limit: str | None = None
    status: str | None = None
    method_id: str | None = None
    function_name: str | None = None
    contract_address: str | None = None
    input_data: str | None = None
    provider: str | None = None
    graph_source: str | None = None
    graph_target: str | None = None
    graph_edge_type: str | None = None
    hop_level: int = 0
    raw: dict[str, Any] | None = None

class WalletAsset(BaseModel):
    contract_address: str | None = None
    symbol: str | None = None
    name: str | None = None
    decimals: int | None = None
    balance_raw: str | None = None
    balance: str | None = None
    provider: str | None = None

class InvestigationResponse(BaseModel):
    investigation_id: str
    address: str
    chain: str
    queried_at: str
    collection: dict[str, Any]
    wallet: dict[str, Any]
    normalized: dict[str, Any] = Field(default_factory=dict)
    transactions: list[NormalizedTransaction] = Field(default_factory=list)
    counterparties: list[dict[str, Any]] = Field(default_factory=list)
    assets: list[WalletAsset] = Field(default_factory=list)
    graph: dict[str, Any] = Field(default_factory=dict)
    derived: dict[str, Any] = Field(default_factory=dict)
    vasp: dict[str, Any] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
    storage: dict[str, Any] = Field(default_factory=dict)
