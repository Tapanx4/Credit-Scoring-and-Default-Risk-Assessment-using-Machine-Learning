from typing import Tuple
from app.core.config import settings
from app.core.lifecycle.states import DecisionOutcome, RiskTier




class PolicyRules:



    @staticmethod
    def apply(pd: float, ev: float) -> Tuple[DecisionOutcome, RiskTier]:
# -----------------------------
# 1. HARD KNOCKOUTS
# -----------------------------
        if pd > settings.MAX_PD_CUTOFF:
            return DecisionOutcome.DECLINE, RiskTier.TIER_R1


        if ev < settings.MIN_PROFIT_BUFFER:
            return DecisionOutcome.DECLINE, RiskTier.TIER_R2


# -----------------------------
# 2. SEGMENTATION
# -----------------------------
        if pd < 0.05:
            return DecisionOutcome.APPROVE, RiskTier.TIER_AA


        if pd < 0.10:
            return DecisionOutcome.APPROVE, RiskTier.TIER_AB


# Borderline but allowed → human review
        return DecisionOutcome.MANUAL_REVIEW, RiskTier.TIER_M1