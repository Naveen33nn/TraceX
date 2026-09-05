import re
from typing import Literal

# Conservative Bitcoin syntactic validation for legacy, P2SH, Bech32 and Bech32m.
_BTC_BASE58_RE = re.compile(r"^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$")
_BTC_BECH32_RE = re.compile(r"^(bc1)[ac-hj-np-z02-9]{11,71}$", re.IGNORECASE)
_TRON_RE = re.compile(r"^T[1-9A-HJ-NP-Za-km-z]{33}$")


def normalize_chain(chain: str | None) -> str:
    if not chain:
        return "auto"
    c = chain.lower().replace("-", "_").strip()
    aliases = {
        "eth": "ethereum",
        "btc": "bitcoin",
        "matic": "polygon",
        "trx": "tron",
    }
    return aliases.get(c, c)


def is_bitcoin_address(address: str) -> bool:
    a = address.strip()
    return bool(_BTC_BASE58_RE.fullmatch(a) or _BTC_BECH32_RE.fullmatch(a))


def is_evm_address(address: str) -> bool:
    a = address.strip()
    return bool(re.fullmatch(r"0x[0-9a-fA-F]{40}", a))


def is_tron_address(address: str) -> bool:
    a = address.strip()
    return bool(_TRON_RE.fullmatch(a))


def detect_chain(address: str) -> str | None:
    a = address.strip()
    if is_bitcoin_address(a):
        return "bitcoin"
    if is_evm_address(a):
        return "evm"
    if is_tron_address(a):
        return "tron"
    return None


def validate_for_chain(address: str, chain: str) -> bool:
    if chain == "bitcoin":
        return is_bitcoin_address(address)
    if chain in {"ethereum", "polygon"}:
        return is_evm_address(address)
    if chain == "tron":
        return is_tron_address(address)
    return False
