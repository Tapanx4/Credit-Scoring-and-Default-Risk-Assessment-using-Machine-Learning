
from typing import Final, Tuple
import math

BASE_RATE: Final[float] = 9.5
LEGAL_APR_CAP: Final[float] = 36.0
PRODUCT_APR_CAP: Final[float] = 28.0

MAX_SPREAD: Final[float] = 35.0   # max risk premium
ALPHA: Final[float] = 1.5         # curvature control


def get_risk_based_pricing(pd: float) -> Tuple[float, bool]:
    # -----------------------------
    # 1. Validate PD
    # -----------------------------
    if pd > 1:
        pd /= 100
    if not 0.0 <= pd <= 1.0:
        raise ValueError("PD must be between 0 and 1")

    # -----------------------------
    # 2. Smooth power-based pricing
    # -----------------------------
    raw_spread = MAX_SPREAD * (pd ** ALPHA)
    apr = BASE_RATE + raw_spread

    # -----------------------------
    # 3. Legal cap
    # -----------------------------
    apr = min(apr, LEGAL_APR_CAP)

    # -----------------------------
    # 4. Product rule
    # -----------------------------
    hit_product_cap = apr > PRODUCT_APR_CAP
    apr = min(apr, PRODUCT_APR_CAP)

    return round(apr, 2), hit_product_cap
