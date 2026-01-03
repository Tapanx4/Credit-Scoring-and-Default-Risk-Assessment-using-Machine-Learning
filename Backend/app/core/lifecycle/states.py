# STEP 1B — Enhanced Lifecycle, Decision & Tiering Enums (Production-Grade)
# File: app/core/lifecycle/states.py

from enum import Enum

# -----------------------------
# APPLICATION LIFECYCLE STATES
# -----------------------------
class ApplicationStatus(str, Enum):
    """Authoritative lifecycle of a loan application.
    Used for frontend state, audits, queues, and regulatory tracking.
    """

    # Pre-decision
    CREATED = "CREATED"              # User started application
    SUBMITTED = "SUBMITTED"          # User submitted (inputs locked)

    # Decisioning
    SCORED = "SCORED"                # Models + economics executed
    OFFERED = "OFFERED"              # Terms generated and shown to user
    MANUAL_REVIEW = "MANUAL_REVIEW"  # Sent to underwriter queue
    DECLINED = "DECLINED"            # Final rejection (auto or manual)

    # Post-decision
    ACCEPTED = "ACCEPTED"            # User accepted offer (e-sign)
    FUNDED = "FUNDED"                # Funds disbursed
    ACTIVE = "ACTIVE"                # Loan active / in repayment

    # Terminal
    CLOSED = "CLOSED"                # Paid in full
    DEFAULTED = "DEFAULTED"          # Charged off


# -----------------------------
# DECISION ENGINE OUTPUT
# -----------------------------
class DecisionOutcome(str, Enum):
    """Immediate output of the decision engine.
    This is NOT the same as lifecycle state.
    """

    APPROVE = "APPROVE"              # Auto-approve and generate offer
    MANUAL_REVIEW = "MANUAL_REVIEW"  # Route to underwriter
    DECLINE = "DECLINE"              # Auto-decline


# -----------------------------
# RISK / ECONOMIC TIERS
# -----------------------------
class RiskTier(str, Enum):
    """Risk tiers used for segmentation, pricing, queues, and CRO views.
    Tier ordering is intentional and sortable.
    """

    # Auto-approval tiers (positive EV, within risk appetite)
    TIER_AA = "A_AutoApprove_Prime"        # Very low PD, high confidence
    TIER_AB = "B_AutoApprove_NearPrime"    # Slightly higher PD, still safe

    # Manual review tiers (borderline cases)
    TIER_M1 = "M1_ManualReview_EV_Positive"   # Positive EV but risk flags
    TIER_M2 = "M2_ManualReview_EV_Marginal"   # Marginal EV / policy edge

    # Rejection tiers
    TIER_R1 = "R1_Reject_HighRisk"          # PD too high
    TIER_R2 = "R2_Reject_NegativeEV"        # Fails economics
    TIER_R3 = "R3_Reject_Policy"            # Hard policy violation
    TIER_MANUAL_OVERRIDE = "Manual_Override"
    
    UNKNOWN = "UNKNOWN"


# -----------------------------
# WHY THIS MATTERS
# -----------------------------
# - Lifecycle ≠ Decision ≠ Tier (they serve different purposes)
# - Frontend consumes ALL THREE
# - CRO filters by Tier, Underwriters by Status, Models output Decision
# - This structure scales to new products without breaking APIs
