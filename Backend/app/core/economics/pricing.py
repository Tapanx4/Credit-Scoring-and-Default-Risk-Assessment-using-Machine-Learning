# app/core/economics/pricing.py

from typing import Final, Tuple
import math

BASE_RATE: Final[float] = 8.0          # Reference / prime rate
LEGAL_APR_CAP: Final[float] = 36.0     # Regulatory hard stop
PRODUCT_APR_CAP: Final[float] = 28.0   # Business / reputation cap
PRICING_SLOPE: Final[float] = 18.0     # Tunable risk sensitivity


def get_risk_based_pricing(pd: float) -> Tuple[float, bool]:
    """
    Returns:
        apr (float): Final APR to display / price at
        hit_product_cap (bool): True if applicant should be declined
                                 due to excessive risk
    """
    # -----------------------------
    # 1. Validate PD
    # -----------------------------
    # Normalize PD if model outputs percentage
    if pd > 1:
        pd = pd / 100
    if pd < 0.0 or pd > 1.0:
        raise ValueError("PD must be between 0 and 1")

    # -----------------------------
    # 2. Smooth, monotonic pricing
    # -----------------------------
    raw_spread = PRICING_SLOPE * math.log1p(pd * 10)
    apr = BASE_RATE + raw_spread

    # -----------------------------
    # 3. Hard legal protection
    # -----------------------------
    apr = min(apr, LEGAL_APR_CAP)

    # -----------------------------
    # 4. Product-level rule
    # -----------------------------
    hit_product_cap = apr > PRODUCT_APR_CAP

    # Clamp APR to product cap for consistency
    apr = min(apr, PRODUCT_APR_CAP)

    return round(apr, 2), hit_product_cap
    
    