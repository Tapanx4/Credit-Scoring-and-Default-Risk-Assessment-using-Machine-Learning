import json
from app.core.scoring.feature_builder import FeatureBuilder
from app.services.credit_bureau_service import CreditBureauService


def test_credit_bureau_feature_trace(capsys):
    """
    Diagnostic test:
    - Pulls credit bureau data
    - Runs FeatureBuilder
    - Prints which bureau values were lost or zeroed
    """

    # -----------------------------
    # 1. Simulate application input
    # -----------------------------
    application_input = {
        "loan": {
            "loan_amnt": 200000,
            "term": 36,
            "purpose": "debt_consolidation",
        },
        "applicant": {
            "ssn": "123-45-6789",
            "annual_inc": 120000,
            "zip_region": "South",
            "emp_length_num": 5,
            "home_ownership": "RENT",
            "verification_status": "Verified",
        },
    }

    # -----------------------------
    # 2. Pull credit bureau data
    # -----------------------------
    bureau = CreditBureauService()
    credit_bureau = bureau.pull_report(application_input["applicant"])

    application_input["credit_bureau"] = credit_bureau

    # -----------------------------
    # 3. Run feature builder
    # -----------------------------
    features = FeatureBuilder.build(application_input)

    # -----------------------------
    # 4. Compare & print
    # -----------------------------
    print("\n=== CREDIT BUREAU → FEATURE BUILDER TRACE ===\n")

    lost = []
    preserved = []

    for k, v in credit_bureau.items():
        feature_val = features.get(k)

        # Bureau had a value, feature is zero or missing
        if v not in (None, 0, 0.0) and feature_val in (None, 0, 0.0):
            lost.append((k, v, feature_val))
        else:
            preserved.append((k, v, feature_val))

    print("---- LOST / ZEROED FEATURES ----")
    for k, raw, engineered in sorted(lost):
        print(f"{k:35} | bureau={raw!r:10} → feature={engineered!r}")

    print("\n---- PRESERVED FEATURES ----")
    for k, raw, engineered in sorted(preserved):
        print(f"{k:35} | bureau={raw!r:10} → feature={engineered!r}")

    # -----------------------------
    # 5. Optional: soft assertion
    # -----------------------------
    # Uncomment once fixed
    # assert not lost, "Some bureau features were lost during feature engineering"
