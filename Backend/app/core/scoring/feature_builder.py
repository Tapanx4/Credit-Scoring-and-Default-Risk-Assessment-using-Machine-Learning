from typing import Dict, Any, Tuple
import math
import random
import numpy as np

# -------------------------------------------------------------
# Helpers (matching training behavior)
# -------------------------------------------------------------
def numeric_or_zero(x):
    try:
        if x in (None, "Missing", ""):
            return 0.0
        return float(x)
    except Exception:
        return 0.0

def safe_div(n, d):
    if n is None or d in (None, 0):
        return None
    return n / d

def safe_float(x, default=0.0):
    try:
        if x is None:
            return default
        return float(x)
    except (TypeError, ValueError):
        return default

def safe_int(x, default=0):
    try:
        if x is None:
            return default
        return int(x)
    except (TypeError, ValueError):
        return default

def log1p_safe(x):
    if x is None or x < 0:
        return 0.0
    return math.log1p(x)

def missing_flag(x) -> int:
    return 1 if x is None else 0

# -------------------------------------------------------------
# Feature Builder
# -------------------------------------------------------------

class FeatureBuilder:
    """
    Single source of truth for PD model features.
    DO NOT modify without retraining.
    """

    @staticmethod
    def _map_fico_to_grade(fico: float) -> Tuple[str, str, float]:
        """
        Maps FICO score to LendingClub-style Grade, Subgrade, and Ordinal.
        Logic aligns with historical lending data cutoffs.
        """
        # Base mapping logic (FICO -> Grade)
        if fico >= 760:   g, base_ord = "A", 1
        elif fico >= 720: g, base_ord = "B", 6
        elif fico >= 680: g, base_ord = "C", 11
        elif fico >= 640: g, base_ord = "D", 16
        elif fico >= 600: g, base_ord = "E", 21
        elif fico >= 560: g, base_ord = "F", 26
        else:             g, base_ord = "G", 31
        
        # Subgrade interpolation (1-5)
        # We pick a subgrade based on where FICO falls within the 40-point band
        # e.g. FICO 750 (Band 720-760) -> Upper end of B -> B1 or B2
        # For simplicity and determinism in this builder, we map to the middle (3)
        # or calculate based on remainder.
        
        # Band width is approx 40 points. 
        # (FICO % 40) / 8 gives 0-4 index. 
        # Higher FICO within band = Lower subgrade number (A1 is better than A5)
        # 759 -> A5? No, 760 is A. 759 is B1.
        # Let's stick to a safe heuristic: map to the middle subgrade (3) if unsure,
        # or randomized if we want variety (but builder should be deterministic).
        # We will use the 'base_ord' (x1) for stability.
        
        sub_g_num = 1 # Default to best subgrade in band for safety
        
        sub_grade = f"{g}{sub_g_num}"
        sub_grade_ord = float(base_ord + (sub_g_num - 1))
        
        return g, sub_grade, sub_grade_ord

    @staticmethod
    def build(raw: Dict[str, Any]) -> Dict[str, Any]:
        loan = raw.get("loan", {})
        applicant = raw.get("applicant", {})
        credit = raw.get("credit_bureau", {})
        
        f: Dict[str, Any] = {}

        # ======================================================
        # 1. RAW / DIRECT FEATURES
        # ======================================================
        raw_amount = safe_float(loan.get("amount") or loan.get("loan_amnt"))
        f["amount"] = raw_amount          # 👈 REQUIRED by DecisionEngine
        f["loan_amnt"] = log1p_safe(raw_amount)

        #f["loan_amnt"] = log1p_safe(loan.get("amount") or loan.get("loan_amnt"))
        
        # term: safe coercion, default 36
        try:
            term_val = str(loan.get("term", 36)).lower().replace("months", "").strip()
            f["term"] = int(term_val)
        except Exception:
            f["term"] = 36
        
        f["int_rate"] = safe_float(loan.get("int_rate"))
        
        # Installment Calculation
        amount = safe_float(loan.get("amount") or loan.get("loan_amnt"))
        term = safe_float(f["term"], 36)
        
        if loan.get("installment"):
            f["installment"] = safe_float(loan.get("installment"))
        else:
            # Estimate installment (Standard Amortization)
            # If int_rate is missing, assume 10% for feature engineering purposes
            rate = safe_float(loan.get("int_rate"), 10.0)
            r = (rate / 100) / 12  
            if r == 0:
                f["installment"] = amount / term
            else:
                f["installment"] = amount * (r * (1 + r)**term) / ((1 + r)**term - 1)

        f["annual_inc"] = log1p_safe(applicant.get("annual_inc") or applicant.get("annual_income"))
        f["pub_rec_bankruptcies"] = safe_float(
        credit.get("pub_rec_bankruptcies"), 0.0
        )

        # Credit Bureau Raw Fields
        f["dti"] = safe_float(credit.get("dti"))
        f["delinq_2yrs"] = safe_float(credit.get("delinq_2yrs"))
        f["inq_last_6mths"] = safe_float(credit.get("inq_last_6mths"))
        f["open_acc"] = safe_float(credit.get("open_acc"))
        f["pub_rec"] = safe_float(credit.get("pub_rec"))
        f["revol_bal"] = log1p_safe(credit.get("revol_bal"))
        f["total_acc"] = safe_float(credit.get("total_acc"))
        f["acc_now_delinq"] = safe_float(credit.get("acc_now_delinq"))
        f["delinq_amnt"] = log1p_safe(credit.get("delinq_amnt"))
        f["mort_acc"] = safe_float(credit.get("mort_acc"))
        f["tax_liens"] = safe_float(credit.get("tax_liens"))
        f["total_bal_il"] = numeric_or_zero(credit.get("total_bal_il"))

        # revol_util — DO NOT CHANGE (per instruction)
        REVOL_UTIL_MEDIAN = 52.0
        f["revol_util"] = safe_float(credit.get("revol_util"))
        if credit.get("revol_util") is None:
            f["revol_util"] = REVOL_UTIL_MEDIAN
        
        # ======================================================
        # 2. CATEGORICAL → ORDINAL / BINARY
        # ======================================================

        # home_ownership
        home_map = {"own": 2, "mortgage": 1, "rent": 0, "other": -1, "none": -1}
        ho = str(applicant.get("home_ownership", "")).lower()
        f["home_ownership"] = home_map.get(ho, -1)

        # verification_status
        ver = str(loan.get("verification_status", "")).lower()
        f["verification_status"] = {"verified": 2, "source verified": 1, "not verified": 0}.get(ver, 0)

        # application_type
        app_type = str(loan.get("application_type", "")).lower()
        f["application_type"] = 1 if "joint" in app_type else 0

        # state_income_tax
        NO_INCOME_TAX_STATES = {"AK", "FL", "NV", "SD", "TX", "WA", "WY", "NH", "TN"}
        state = str(applicant.get("addr_state") or applicant.get("address_state") or "").upper()
        f["state_income_tax"] = 0 if state in NO_INCOME_TAX_STATES else 1
        f["initial_list_status"] = "w"

        # Numerical ordinal (MODEL INPUT — REQUIRED)
        f["initial_list_status_ord"] = 0
        f["purpose"] = str(loan.get("purpose", "debt_consolidation"))
        f["emp_cat"] = str(applicant.get("emp_cat", "Unknown"))
        f["zip_region"] = str(applicant.get("zip_region", "Unknown")) # Logic to derive region from zip needed if not present

        # ======================================================
        # 3. EMPLOYMENT FEATURES
        # ======================================================
        f["emp_length_num"] = safe_int(applicant.get("emp_length") or applicant.get("emp_length_num"))

        # ======================================================
        # 4. MONTHS-SINCE FEATURES (999 + FLAG)
        # ======================================================
        months_since = [
            "mths_since_last_delinq", "mths_since_last_record", "mths_since_last_major_derog",
            "mths_since_recent_bc", "mths_since_recent_bc_dlq", "mths_since_recent_inq",
            "mths_since_recent_revol_delinq", "mths_since_rcnt_il",
            "mo_sin_old_il_acct", "mo_sin_old_rev_tl_op", "mo_sin_rcnt_rev_tl_op", "mo_sin_rcnt_tl",
        ]

        for k in months_since:
            v = credit.get(k)
            if isinstance(v, (np.ndarray, list, tuple)):
                if len(v) > 0:
                    v = v[0]   # pick first element
                else:
                    v = None

    # normalize invalid inputs
            if v in (None, "Missing", ""):
                v = None
            f[k] = 999 if v is None else safe_float(v)
            f[f"{k}_missing"] = missing_flag(v)

        # ======================================================
        # 5. COUNTS / TOTALS (ZERO IMPUTE)
        # ======================================================
        zero_fill = [
            "open_acc_6m", "open_il_12m", "open_il_24m", "open_rv_12m", "open_rv_24m", "open_act_il",
            "inq_fi", "total_cu_tl", "inq_last_12m", "acc_open_past_24mths", "avg_cur_bal",
            "bc_open_to_buy", "bc_util", "percent_bc_gt_75", "total_rev_hi_lim", "total_bal_ex_mort",
            "total_bc_limit", "total_il_high_credit_limit", "tot_coll_amt", "tot_cur_bal", "tot_hi_cred_lim","collections_12_mths_ex_med","total_bal_il","max_bal_bc","chargeoff_within_12_mths","bc_open_to_buy"
        ]

        for k in zero_fill:
            f[k] = safe_float(f.get(k), 0.0)

        # ======================================================
        # 6. UTILIZATION FEATURES
        # ======================================================
        f["il_util"] = safe_float(credit.get("il_util"), 0.0)
        f["il_util_missing"] = safe_int(
            credit.get("il_util_missing"),
            missing_flag(credit.get("il_util"))
        )


        f["all_util"] = safe_float(credit.get("all_util"), 0.0)
        f["all_util_missing"] = missing_flag(credit.get("all_util"))

        f["utilization_gap"] = max(-100, min(100, f.get("bc_util", 0) - f.get("il_util", 0)))
        f["bc_open_to_buy_missing"] = missing_flag(
        credit.get("bc_open_to_buy")
        )

        # ======================================================
        # 7. CREDIT QUALITY
        # ======================================================
        f["pct_tl_nvr_dlq"] = safe_float(credit.get("pct_tl_nvr_dlq"), 100.0)
        f["pct_tl_nvr_dlq_missing"] = missing_flag(credit.get("pct_tl_nvr_dlq"))

        # no_card_flag
        f["no_card_flag"] = int(
            f.get("total_bc_limit", 0) == 0 and f.get("bc_open_to_buy", 0) == 0
        )
        # ======================================================
        # 4.5 COPY BUREAU NUMERIC TOTALS (CRITICAL)
        # ======================================================
        BUREAU_NUMERIC_TOTALS = [
            "acc_open_past_24mths",
            "avg_cur_bal",
            "bc_open_to_buy",
            "bc_util",
            "inq_fi",
            "inq_last_12m",
            "max_bal_bc",
            "open_il_24m",
            "open_rv_12m",
            "percent_bc_gt_75",
            "tot_coll_amt",
            "tot_cur_bal",
            "tot_hi_cred_lim",
            "total_bal_ex_mort",
            "total_bc_limit",
            "total_il_high_credit_limit",
            "total_rev_hi_lim",
        ]

        for k in BUREAU_NUMERIC_TOTALS:
            if k in credit:
                f[k] = safe_float(credit.get(k))

        # ======================================================
        # 8. POST-2013 / EXTENDED CREDIT FLAGS
        # ======================================================
        # In a real app, these depend on the dataset vintage. For new apps (current year),
        # we are post-2013 and have extended data.
        f["post_2013_credit"] = 1 
        f["extended_credit_data_present"] = 1
        
        f["post2013_no_extended_data"] = int(
            f["post_2013_credit"] == 1 and f["extended_credit_data_present"] == 0
        )

        # ======================================================
        # 9. DERIVED RATIOS (RISK & RATIO ENGINEERING)
        # ======================================================
        # Installment to Income
        annual_income = safe_float(applicant.get("annual_inc") or applicant.get("annual_income"))
        f["installment_to_income"] = safe_div(f.get("installment"), annual_income)

        # Recent Expansion Ratio
        f["recent_expansion_ratio"] = safe_div(f.get("acc_open_past_24mths"), f.get("total_acc"))

        # Debt Service Ratio
        monthly_income = annual_income / 12.0 if annual_income > 0 else 1.0
        revol_bal_raw = safe_float(credit.get("revol_bal"))
        f["debt_service_ratio"] = safe_div(
            f.get("installment") + (0.03 * revol_bal_raw),
            monthly_income
        )

        f["credit_age_months"] = safe_float(credit.get("credit_age_months"), 0)
        NUMERIC_CREDIT_FIELDS = [
        "num_accts_ever_120_pd",
        "num_actv_bc_tl",
        "num_actv_rev_tl",
        "num_bc_sats",
        "num_bc_tl",
        "num_il_tl",
        "num_op_rev_tl",
        "num_rev_accts",
        "num_rev_tl_bal_gt_0",
        "num_sats",
        "num_tl_120dpd_2m",
        "num_tl_30dpd",
        "num_tl_90g_dpd_24m",
        "num_tl_op_past_12m",
        # add the rest from training schema
        ]

        for k in NUMERIC_CREDIT_FIELDS:
            f[k] = safe_float(credit.get(k), 0.0)


        # ======================================================
        # 10. FICO / GRADE FEATURES
        # ======================================================
        f["fico_score"] = safe_float(credit.get("fico_score"))
        
        # Grade Mapping Logic (Use internal helper)
        if "grade" in credit and "sub_grade" in credit:
             f["grade"] = credit["grade"]
             f["sub_grade"] = credit["sub_grade"]
             f["sub_grade_ord"] = safe_float(credit.get("sub_grade_ord"))
        else:
             # Fallback derivation if missing from bureau (e.g. testing raw FICO)
             g, sub, ord_val = FeatureBuilder._map_fico_to_grade(f["fico_score"])
             f["grade"] = g
             f["sub_grade"] = sub
             f["sub_grade_ord"] = ord_val

        # ======================================================
        # 11. NN STACKED FEATURE
        # ======================================================
        # Placeholder - will be filled by the Scoring Engine
        f["nn_risk_score"] = None

        return f 
