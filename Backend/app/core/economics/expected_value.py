from pydantic import BaseModel

# -----------------------------
# EXPECTED VALUE CALCULATOR
# -----------------------------
# This is the "Bank-Grade" math using amortization assumptions.

# Constants
COST_OF_FUNDS = 0.04    # 4% (Cost to borrow capital)
SERVICING_COST = 150.0  # Fixed cost per loan (Processing, Support)
AMORTIZATION_FACTOR = 0.55  # Avg outstanding balance over life of loan

class EconomicsResult(BaseModel):
    profit_good: float
    loss_bad: float
    expected_value: float
    roi_percent: float

def calculate_expected_value(
    loan_amount: float,
    interest_rate: float,
    term_months: int,
    pd: float,
    lgd: float
) -> EconomicsResult:
    """
    Computes the Expected Value (EV) of a loan application.
    
    Formula: EV = (1 - PD) * Profit_if_Paid - (PD * Loss_if_Default)
    """
    # 1. Component Setup
    term_years = term_months / 12.0
    rate_decimal = interest_rate / 100.0
    
    # 2. Income & Costs (Amortized)
    # We earn interest on the *outstanding* balance, not the full amount.
    interest_income = loan_amount * rate_decimal * term_years * AMORTIZATION_FACTOR
    funding_cost = loan_amount * COST_OF_FUNDS * term_years * AMORTIZATION_FACTOR
    
    # 3. Scenario A: Good Loan (Paid in Full)
    profit_good = interest_income - funding_cost - SERVICING_COST
    
    # 4. Scenario B: Bad Loan (Default)
    loss_bad = loan_amount * lgd
    
    # 5. Expected Value (Probability Weighted)
    ev = ((1 - pd) * profit_good) - (pd * loss_bad)
    
    # 6. ROI Metric
    roi = (ev / loan_amount) * 100.0
    
    return EconomicsResult(
        profit_good=round(profit_good, 2),
        loss_bad=round(loss_bad, 2),
        expected_value=round(ev, 2),
        roi_percent=round(roi, 2)
    )