# =============================================================
# models/schema/policy.py — VERIFIED
# =============================================================
from pydantic import BaseModel
from datetime import date


class PolicyThresholds(BaseModel):
    max_pd_cutoff: float
    min_profit_buffer: float
    lgd_assumption: float


class PolicyResponse(BaseModel):
    policy_id: str
    effective_date: date
    description: str
    thresholds: PolicyThresholds
