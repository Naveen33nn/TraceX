from typing import Protocol

class VASPLabelProvider(Protocol):
    name: str
    async def lookup(self, address: str, chain: str) -> dict: ...
