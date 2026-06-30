"""Pydantic settings loaded from config.yaml.

A single typed config object is threaded through the whole system so the loop,
bandit, environment, and dashboard all read the same knobs. No module reads
config.yaml directly except through ``load_config``.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field

_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = _DIR / "config.yaml"


class SimulationConfig(BaseModel):
    n_iterations: int = 20000
    candidates_per_decision: int = 30
    render_every: int = 2000
    seed: int = 42
    warmup_iterations: int = 0
    iters_per_day: int = 200  # logical day length for guardrail frequency caps


class HoldoutConfig(BaseModel):
    fraction: float = 0.10


class ObjectiveWeights(BaseModel):
    w_reply: float = 1.0
    w_meeting: float = 3.0
    w_click: float = 0.15
    w_unsub: float = 2.0
    w_complaint: float = 6.0
    w_negreply: float = 1.0
    w_deliv_decay: float = 1.0


class BanditConfig(BaseModel):
    exploration: Literal["epsilon", "squarecb", "cover"] = "squarecb"
    epsilon: float = 0.1
    gamma_scale: float = 100.0     # squarecb greediness scale
    gamma_exponent: float = 0.5    # squarecb greediness exponent
    cover: int = 5
    cb_type: Literal["mtr", "dr", "ips"] = "mtr"  # squarecb requires mtr
    learning_rate: float = 0.5
    power_t: float = 0.0
    interactions: list[str] = Field(default_factory=lambda: ["CA"])
    quadratic: list[str] = Field(default_factory=lambda: ["CA"])
    normalize: bool = True
    epsilon_decay: bool = False
    epsilon_decay_floor: float = 0.01
    model_path: str = "vw_model.bin"


class DeliverabilityConfig(BaseModel):
    domain_warmup: Literal["healthy", "warming", "cold"] = "healthy"
    spf_dkim_dmarc: Literal["pass", "partial", "fail"] = "pass"
    decay_per_complaint: float = 0.03
    health_recovery_per_iter: float = 0.01
    placement_open_multiplier: dict[str, float] = Field(
        default_factory=lambda: {"primary": 1.0, "promotions": 0.55, "spam": 0.08}
    )


class GuardrailsConfig(BaseModel):
    max_per_contact_per_day: int = 1
    max_per_contact_per_week: int = 3
    cooldown_after_n_nonengage: int = 4
    complaint_rate_ceiling: float = 0.05
    max_sends_per_day_run: int = 1_000_000
    # value lists may contain bools/strings; compared case-insensitively as strings
    banned_lever_values: dict[str, list[Any]] = Field(default_factory=dict)


class RenderingConfig(BaseModel):
    provider: Literal["mock", "anthropic"] = "mock"
    model: str = "claude-3-5-sonnet-latest"
    max_tokens: int = 700


class StorageConfig(BaseModel):
    backend: Literal["sqlite", "memory"] = "sqlite"
    path: str = "runs.db"


class Config(BaseModel):
    simulation: SimulationConfig = Field(default_factory=SimulationConfig)
    holdout: HoldoutConfig = Field(default_factory=HoldoutConfig)
    objective: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    bandit: BanditConfig = Field(default_factory=BanditConfig)
    deliverability: DeliverabilityConfig = Field(default_factory=DeliverabilityConfig)
    guardrails: GuardrailsConfig = Field(default_factory=GuardrailsConfig)
    rendering: RenderingConfig = Field(default_factory=RenderingConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)


def load_config(path: str | Path | None = None) -> Config:
    """Load and validate config.yaml. Missing file -> all defaults."""
    cfg_path = Path(path) if path else DEFAULT_CONFIG_PATH
    if not cfg_path.exists():
        return Config()
    with cfg_path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f) or {}
    return Config.model_validate(raw)
