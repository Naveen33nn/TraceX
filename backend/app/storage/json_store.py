import json
from pathlib import Path
from typing import Any


def save_snapshot(
    root_dir: str | Path,
    chain: str,
    investigation_id: str,
    raw_payload: dict[str, Any],
    normalized_payload: dict[str, Any],
    graph_payload: dict[str, Any],
    vasp_payload: dict[str, Any] | None = None,
) -> dict[str, str]:
    base = Path(root_dir) / chain / investigation_id
    raw_dir = base / "raw"
    normalized_dir = base / "normalized"
    graph_dir = base / "graph"
    vasp_dir = base / "vasp"
    for directory in (raw_dir, normalized_dir, graph_dir, vasp_dir):
        directory.mkdir(parents=True, exist_ok=True)
    paths = {
        "raw": raw_dir / "raw.json",
        "normalized": normalized_dir / "normalized.json",
        "graph": graph_dir / "graph.json",
        "vasp": vasp_dir / "vasp.json",
    }
    paths["raw"].write_text(json.dumps(raw_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    paths["normalized"].write_text(json.dumps(normalized_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    paths["graph"].write_text(json.dumps(graph_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    paths["vasp"].write_text(
        json.dumps(vasp_payload if vasp_payload is not None else {"vasp_storage_disabled": True}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    return {key: str(value) for key, value in paths.items()}


def load_normalized_snapshot(root_dir: str | Path, investigation_id: str, chain: str = "") -> dict[str, Any]:
    root = Path(root_dir)
    candidates = [root / chain / investigation_id / "normalized" / "normalized.json"] if chain else list(root.glob(f"*/{investigation_id}/normalized/normalized.json"))
    for path in candidates:
        if path.exists():
            normalized = json.loads(path.read_text(encoding="utf-8"))
            base = path.parent.parent
            vasp_path = base / "vasp" / "vasp.json"
            if vasp_path.exists():
                normalized["vasp"] = json.loads(vasp_path.read_text(encoding="utf-8"))
            return normalized
    raise FileNotFoundError(f"Normalized snapshot not found for investigation '{investigation_id}'")
