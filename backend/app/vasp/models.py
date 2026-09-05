from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

VASPState = Literal["identified", "unidentified", "cluster_only", "conflict"]


class VASPProviderResult(BaseModel):
    provider: str
    status: str = "ok"
    found: bool = False
    cluster_found: bool = False
    entity_name: str = ""
    label: str = ""
    entity_type: str = ""
    categories: list[str] = Field(default_factory=list)
    attributes: list[dict[str, Any]] = Field(default_factory=list)
    wallet_id: str = ""
    chain_id: int | None = None
    confidence: str = ""
    error: str = ""
    cache_hit: bool = False
    raw: dict[str, Any] = Field(default_factory=dict)


class VASPVerdict(BaseModel):
    state: VASPState = "unidentified"
    identified: bool = False
    cluster_only: bool = False
    conflict: bool = False
    consensus: str = ""
    consensus_candidates: list[str] = Field(default_factory=list)
    matching_providers: list[str] = Field(default_factory=list)
    cluster_providers: list[str] = Field(default_factory=list)
    successful_providers: list[str] = Field(default_factory=list)
    failed_providers: list[str] = Field(default_factory=list)
    provider_count: int = 0
    entity_count: int = 0
    confidence: str = "none"


class VASPCheckResult(BaseModel):
    address: str
    chain: str
    checked_at: str
    cache_hit: bool = False
    verdict: VASPVerdict = Field(default_factory=VASPVerdict)
    providers: list[VASPProviderResult] = Field(default_factory=list)
