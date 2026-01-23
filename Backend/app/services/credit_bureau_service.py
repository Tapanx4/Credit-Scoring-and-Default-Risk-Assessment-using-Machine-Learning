import numpy as np
import hashlib
from typing import Dict, Any

# ------------------------------------------------
# Utilities
# ------------------------------------------------

def seeded_rng_from_ssn(ssn: str) -> np.random.Generator:
    """Create a deterministic RNG from SSN."""
    h = hashlib.sha256(ssn.encode()).hexdigest()
    seed = int(h[:8], 16)
    return np.random.default_rng(seed)


def clipped_normal(rng, mean, std, low=0, high=None):
    x = rng.normal(mean, std)
    if high is not None:
        x = min(x, high)
    return max(low, x)


MISSING_ELIGIBLE = {
    'mths_since_last_delinq',
    'mths_since_last_record',
    'mths_since_last_major_derog',
    'mths_since_recent_bc',
    'mths_since_recent_bc_dlq',
    'mths_since_recent_inq',
    'mths_since_recent_revol_delinq',
    'mo_sin_old_il_acct',
    'mo_sin_old_rev_tl_op',
    'mo_sin_rcnt_rev_tl_op',
    'mo_sin_rcnt_tl',
    'all_util',
    'il_util',
    'pct_tl_nvr_dlq',
    'bc_open_to_buy',
    'mths_since_rcnt_il'
}

class CreditBureauService:
    """
    Deterministic mock credit bureau generator.
    Same SSN will ALWAYS produce the same bureau report.
    """

        
    def pull_report(self, applicant: Dict[str, Any]) -> Dict[str, Any]:
        ssn = applicant.get("ssn")

        if not ssn:
            raise ValueError("SSN required for bureau pull")

        # Deterministic identity key
        ssn_hash = hashlib.sha256(ssn.encode()).hexdigest()

        return self._generate(ssn_hash)

    def _generate(self, ssn: str) -> Dict[str, Any]:
        rng = seeded_rng_from_ssn(ssn)

        # ---------------- Credit Age ----------------
        credit_age_months = rng.integers(24, 300)

        # ---------------- Account Counts (Topology Correct) ----------------
        total_acc = rng.integers(5, 35)
        open_acc = rng.integers(3, total_acc + 1)

        mort_acc = rng.integers(0, min(3, open_acc) + 1)
        remaining = open_acc - mort_acc
        revol_accounts = rng.integers(0, max(remaining + 1, 1))        
        installment_accounts = remaining - revol_accounts

        # ---------------- Limits & Utilization ----------------
        total_bc_limit = rng.integers(3_000, 100_000)
        revol_util = clipped_normal(rng, 0.45, 0.2, 0, 1.2) # Allow > 100% rarely
        revol_bal = int(total_bc_limit * revol_util)
        bc_open_to_buy = max(0, total_bc_limit - revol_bal)

        # ---------------- Installment ----------------
        total_il_high_credit_limit = rng.integers(5_000, 150_000)
        total_bal_il = int(total_il_high_credit_limit * clipped_normal(rng, 0.5, 0.25, 0, 1))

        # ---------------- Monthly Payment Proxy (DTI Logic) ----------------
        monthly_revol = revol_bal * 0.03
        monthly_install = total_bal_il / 36
        monthly_payment = monthly_revol + monthly_install
        dti = clipped_normal(rng, (monthly_payment / 4000) * 100, 8, 0, 60)

        # ---------------- Inquiries ----------------
        inq_last_6mths = rng.integers(0, 7)
        inq_last_12m = inq_last_6mths + rng.integers(0, 4)

        # ---------------- Delinquencies ----------------
        delinq_2yrs = rng.binomial(2, 0.12)
        acc_now_delinq = rng.binomial(1, 0.05)
        delinq_amnt = rng.integers(500, 5000) if delinq_2yrs > 0 else 0

        # ---------------- Public Records ----------------
        pub_rec_bankruptcies = rng.binomial(1, 0.05)
        tax_liens = rng.binomial(1, 0.03)
        pub_rec = pub_rec_bankruptcies + tax_liens

        # ---------------- Recency / Time Since ----------------
        def maybe_missing(val, p=0.2):
            return None if rng.random() < p else val

        # ---------------- FICO Generation (Correlated) ----------------
        # Base Score starts high
        score = 740 
        # Penalties based on bad behavior
        score -= (delinq_2yrs * 30)
        score -= (pub_rec * 50)
        score -= int(revol_util * 80) # High util hurts
        score -= (inq_last_6mths * 5)
        # Bonuses for age
        score += min(100, credit_age_months // 4)
        # Noise
        score += rng.integers(-20, 20)
        fico_score = int(max(450, min(850, score)))

        # ---------------- Aggregates ----------------
        total_rev_hi_lim = total_bc_limit + rng.integers(0, 20000)
        tot_hi_cred_lim = total_rev_hi_lim + total_il_high_credit_limit
        total_bal_ex_mort = revol_bal + total_bal_il
        # Add Mortgage Balance to Totals if Mortgage Exists
        mortgage_bal = rng.integers(100_000, 500_000) if mort_acc > 0 else 0
        tot_cur_bal = total_bal_ex_mort + mortgage_bal
        
        # Derived Average Balance
        avg_cur_bal = int(tot_cur_bal / max(1, open_acc)) if open_acc > 0 else 0

        record = {
            # Core
            'fico_score': fico_score,
            'dti': round(dti, 2),
            'delinq_2yrs': delinq_2yrs,
            'inq_last_6mths': inq_last_6mths,
            'open_acc': open_acc,
            'pub_rec': pub_rec,
            'revol_bal': revol_bal,
            'revol_util': round(revol_util * 100, 1),
            'total_acc': total_acc,
            'mort_acc': mort_acc,
            'tax_liens': tax_liens,
            'pub_rec_bankruptcies': pub_rec_bankruptcies,

            # Timing
            'mths_since_last_delinq': maybe_missing(rng.integers(3, 60)),
            'mths_since_last_record': maybe_missing(rng.integers(12, 120)),
            'mths_since_last_major_derog': maybe_missing(rng.integers(24, 120)),
            'mths_since_recent_bc': maybe_missing(rng.integers(3, 36)),
            'mths_since_recent_bc_dlq': maybe_missing(rng.integers(6, 48)),
            'mths_since_recent_inq': maybe_missing(rng.integers(1, 12)),
            'mths_since_recent_revol_delinq': maybe_missing(rng.integers(12, 60)),

            # Counts
            'acc_now_delinq': acc_now_delinq,
            'num_accts_ever_120_pd': rng.binomial(2, 0.08),
            'num_actv_bc_tl': rng.integers(1, revol_accounts + 1),
            'num_actv_rev_tl': revol_accounts,
            'num_bc_sats': rng.integers(0, revol_accounts + 1),
            'num_bc_tl': revol_accounts,
            'num_il_tl': installment_accounts,
            'num_op_rev_tl': revol_accounts,
            'num_rev_accts': revol_accounts,
            'num_rev_tl_bal_gt_0': min(
                revol_accounts,
                max(1, int(revol_accounts * revol_util))
            ),
            'num_sats': rng.integers(0, total_acc + 1),
            'num_tl_120dpd_2m': rng.binomial(1, 0.05),
            'num_tl_30dpd': rng.binomial(2, 0.1),
            'num_tl_90g_dpd_24m': rng.binomial(1, 0.07),
            'num_tl_op_past_12m': rng.integers(0, 4),
            'acc_open_past_24mths': rng.integers(0, 6),

            # Revolving / Installment
            'open_rv_12m': rng.integers(0, 3),
            'open_rv_24m': rng.integers(0, 5),
            'open_il_12m': rng.integers(0, 2),
            'open_il_24m': rng.integers(0, 4),
            'open_acc_6m': rng.integers(0, 3),
            'open_act_il': rng.integers(0, installment_accounts + 1),
            'total_bal_il': total_bal_il,
            'total_bal_ex_mort': total_bal_ex_mort,
            'total_bc_limit': total_bc_limit,
            'total_il_high_credit_limit': total_il_high_credit_limit,
            'total_rev_hi_lim': total_rev_hi_lim,
            'tot_hi_cred_lim': tot_hi_cred_lim,
            'tot_cur_bal': tot_cur_bal,
            'tot_coll_amt': rng.integers(0, 3000),
            'max_bal_bc': rng.integers(500, total_bc_limit),
            'bc_open_to_buy': maybe_missing(bc_open_to_buy),
            'bc_util': round(revol_util * 100, 1),
            'percent_bc_gt_75': int(revol_util > 0.75) * rng.integers(20, 100),
            'all_util': maybe_missing(round((revol_bal + total_bal_il) / max(1, total_bc_limit + total_il_high_credit_limit) * 100, 1)),
            'il_util': maybe_missing(round(total_bal_il / max(1, total_il_high_credit_limit) * 100, 1)),
            'pct_tl_nvr_dlq': maybe_missing(round(rng.uniform(60, 100), 1)),
            
            # Derived Metrics
            'avg_cur_bal': avg_cur_bal,

            # Inquiries / Collections
            'inq_fi': rng.integers(0, 3),
            'inq_last_12m': inq_last_12m,
            'collections_12_mths_ex_med': rng.binomial(1, 0.06),
            'chargeoff_within_12_mths': rng.binomial(1, 0.04),
            'delinq_amnt': delinq_amnt,

            # Credit History
            'mo_sin_old_il_acct': maybe_missing(rng.integers(12, credit_age_months)),
            'mo_sin_old_rev_tl_op': maybe_missing(rng.integers(12, credit_age_months)),
            'mo_sin_rcnt_rev_tl_op': maybe_missing(rng.integers(1, 24)),
            'mo_sin_rcnt_tl': maybe_missing(rng.integers(1, 24)),
            'credit_age_months': credit_age_months,
            'mths_since_rcnt_il': maybe_missing(rng.integers(1, 24)),
            
            # Static Flags required by model
            'post_2013_credit': 1,
            'extended_credit_data_present': 1
        }

        # ---------------- Missing Flags ----------------
        for k in MISSING_ELIGIBLE:
            record[f'{k}_missing'] = int(record.get(k) is None)
            if record.get(k) is None:
                record[k] = 0

        return record
        