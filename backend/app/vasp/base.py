from typing import Protocol


class VASPProvider(Protocol):
    name: str

    async def lookup(self, address: str, chain: str) -> dict: ...
