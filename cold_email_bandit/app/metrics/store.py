"""Repository interface for logged decisions, with SQLite and in-memory implementations.

The loop logs (sampled) decision rows behind this interface so the data layer can swap
to Postgres/Supabase without touching loop code (build prompt sections 3 and 18). Rows
carry the logged propensity, which is required for replay and off-policy evaluation.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable, Optional, Protocol


class Store(Protocol):
    def log_decision(self, row: dict[str, Any]) -> None: ...
    def flush(self) -> None: ...
    def count(self) -> int: ...
    def fetch(self, limit: int = 1000, is_holdout: Optional[bool] = None) -> list[dict[str, Any]]: ...
    def close(self) -> None: ...


def make_store(backend: str, path: str | Path = "runs.db") -> Store:
    if backend == "sqlite":
        return SQLiteStore(path)
    return MemoryStore()


class MemoryStore:
    def __init__(self) -> None:
        self._rows: list[dict[str, Any]] = []

    def log_decision(self, row: dict[str, Any]) -> None:
        self._rows.append(row)

    def flush(self) -> None:  # nothing to flush
        pass

    def count(self) -> int:
        return len(self._rows)

    def fetch(self, limit: int = 1000, is_holdout: Optional[bool] = None) -> list[dict[str, Any]]:
        rows = self._rows
        if is_holdout is not None:
            rows = [r for r in rows if bool(r.get("is_holdout")) == is_holdout]
        return rows[-limit:]

    def close(self) -> None:
        pass


class SQLiteStore:
    """Batched-insert SQLite store. Context/recipe/outcomes are stored as JSON blobs."""

    def __init__(self, path: str | Path, batch_size: int = 1000):
        self.path = str(path)
        self.batch_size = batch_size
        self._buf: list[tuple] = []
        self.conn = sqlite3.connect(self.path)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS decisions (
                t INTEGER, is_holdout INTEGER, score REAL, propensity REAL,
                placement TEXT, intent TEXT, industry TEXT, role_seniority TEXT,
                sequence_position TEXT, context_json TEXT, recipe_json TEXT,
                outcomes_json TEXT
            )
            """
        )
        self.conn.commit()

    def log_decision(self, row: dict[str, Any]) -> None:
        ctx = row.get("context", {})
        self._buf.append(
            (
                row.get("t"), int(bool(row.get("is_holdout"))), row.get("score"),
                row.get("propensity"), row.get("placement"), ctx.get("intent"),
                ctx.get("industry"), ctx.get("role_seniority"), ctx.get("sequence_position"),
                json.dumps(ctx), json.dumps(row.get("recipe", {})),
                json.dumps(row.get("outcomes", {})),
            )
        )
        if len(self._buf) >= self.batch_size:
            self.flush()

    def flush(self) -> None:
        if not self._buf:
            return
        self.conn.executemany(
            "INSERT INTO decisions VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", self._buf
        )
        self.conn.commit()
        self._buf.clear()

    def count(self) -> int:
        self.flush()
        return self.conn.execute("SELECT COUNT(*) FROM decisions").fetchone()[0]

    def fetch(self, limit: int = 1000, is_holdout: Optional[bool] = None) -> list[dict[str, Any]]:
        self.flush()
        q = "SELECT t,is_holdout,score,propensity,placement,context_json,recipe_json,outcomes_json FROM decisions"
        params: Iterable[Any] = ()
        if is_holdout is not None:
            q += " WHERE is_holdout=?"
            params = (int(is_holdout),)
        q += " ORDER BY t DESC LIMIT ?"
        params = (*params, limit)
        out = []
        for r in self.conn.execute(q, params):
            out.append(
                {
                    "t": r[0], "is_holdout": bool(r[1]), "score": r[2], "propensity": r[3],
                    "placement": r[4], "context": json.loads(r[5]),
                    "recipe": json.loads(r[6]), "outcomes": json.loads(r[7]),
                }
            )
        return out

    def close(self) -> None:
        self.flush()
        self.conn.close()
