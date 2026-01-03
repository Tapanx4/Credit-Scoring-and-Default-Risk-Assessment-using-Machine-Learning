# =============================================================
# decision_engine.py — FINAL, POLICY-AWARE & STRESS-AWARE
# =============================================================
from typing import Dict, Any

from app.core.scoring.pd_model import ScoringEngine
from app.core.economics.pricing import get_risk_based_pricing
from app.core.economics.lgd import get_lgd
from app.core.economics.expected_value import calculate_expected_value
from app.core.lifecycle.states import DecisionOutcome, RiskTier

from app.core.policy.rules import PolicyRules
from app.core.policy.stress import StressTester
from app.core.policy.versioning import get_active_policy


class DecisionEngine:
    """
    The Central Brain.
    Orchestrates: Scoring → Pricing → Economics → Stress → Policy → Decision.

    Guarantees:
    - Pure function (no DB mutation)
    - Auditable snapshot
    - Policy & stress aware
    """

    def __init__(self):
        self.scorer = ScoringEngine()

    def decide(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        # --------------------------------------------------
        # 0. POLICY CONTEXT
        # --------------------------------------------------
        policy = get_active_policy()

        # --------------------------------------------------
        # 1. INPUT VALIDATION
        # --------------------------------------------------
        amount = application_data.get("amount")
        term = application_data.get("term", 36)

        if amount is None or amount <= 0:
            raise ValueError("Loan amount must be positive")

        # --------------------------------------------------
        # 2. SCORING (ML)
        # --------------------------------------------------
        # Expected keys: calibrated_pd, score, grade, model_version
        score_result = self.scorer.predict(application_data)
        pd = score_result["calibrated_pd"]
        grade = score_result.get("grade")

        # --------------------------------------------------
        # 3. PRICING
        # --------------------------------------------------
        apr, hit_product_cap = get_risk_based_pricing(pd)

        if hit_product_cap:
            return self._decline(
                tier=RiskTier.TIER_R3,
                reason="PRICING_CAP_REACHED",
                score_result=score_result,
                policy_id=policy.id,
                apr=apr,
            )

        # --------------------------------------------------
        # 4. ECONOMICS (BASE CASE)
        # --------------------------------------------------
        lgd_value = get_lgd(grade)

        econ = calculate_expected_value(
            loan_amount=amount,
            interest_rate=apr,
            term_months=term,
            pd=pd,
            lgd=lgd_value,
        )

        # --------------------------------------------------
        # 5. STRESS TESTING (SHADOW REJECTION)
        # --------------------------------------------------
        stress_passed = StressTester.is_robust(
            loan_amount=amount,
            apr=apr,
            term_months=term,
            pd=pd,
            base_lgd=lgd_value,
        )

        if not stress_passed:
            return self._decline(
                tier=RiskTier.TIER_R3,
                reason="FAILED_STRESS_TEST",
                score_result=score_result,
                policy_id=policy.id,
                apr=apr,
            )

        # --------------------------------------------------
        # 6. POLICY RULES
        # --------------------------------------------------
        decision, tier = PolicyRules.apply(pd, econ.expected_value)

        # --------------------------------------------------
        # 7. OFFER (IF APPROVED / REVIEW)
        # --------------------------------------------------
        offer = None
        if decision != DecisionOutcome.DECLINE:
            offer = {
                "amount": amount,
                "term": term,
                "apr": apr,
                "monthly_payment": self._calculate_pmt(amount, apr, term),
            }

        # --------------------------------------------------
        # 8. FINAL DECISION SNAPSHOT
        # --------------------------------------------------
        return {
            "decision": decision,
            "tier": tier,
            "policy_version": policy.id,
            "risk_profile": score_result,
            "economics": {
                "pricing_apr": apr,
                "lgd_used": lgd_value,
                **econ.dict(),
            },
            "stress_test_passed": True,
            "offer": offer,
            "decline_reason": None if decision != DecisionOutcome.DECLINE else "POLICY_DECLINE",
        }

    # =============================================================
    # INTERNAL HELPERS
    # =============================================================

    # def _decline(self, tier, reason, score_result, policy_id, apr):
    #     return {
    #         "decision": DecisionOutcome.DECLINE,
    #         "tier": tier,
    #         "policy_version": policy_id,
    #         "risk_profile": score_result,
    #         "economics": {
    #             "pricing_apr": apr,
    #         },
    #         "stress_test_passed": False,
    #         "offer": None,
    #         "decline_reason": reason,
    #     }
   
    def _decline(self, tier, reason, score_result, policy_id, apr):
        return {
            "decision": DecisionOutcome.DECLINE,
            "tier": tier,
            "policy_version": policy_id,
            "risk_profile": score_result,
            "economics": {
                "pricing_apr": apr,
                "expected_value": 0.0,   # ✅ REQUIRED
            },
            "stress_test_passed": False,
            "offer": None,
            "decline_reason": reason,
        }

    def _calculate_pmt(self, principal: float, annual_rate: float, months: int) -> float:
        r = (annual_rate / 100) / 12
        if r == 0:
            return round(principal / months, 2)
        pmt = principal * (r * (1 + r) ** months) / ((1 + r) ** months - 1)
        return round(pmt, 2)
