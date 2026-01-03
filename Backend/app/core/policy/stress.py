from app.core.economics.expected_value import calculate_expected_value




class StressTester:



    @staticmethod
    def stressed_ev(
        loan_amount: float,
        apr: float,
        term_months: int,
        pd: float,
        base_lgd: float,
        shock_factor: float = 1.20,
    ) -> float:
        stressed_lgd = min(base_lgd * shock_factor, 1.0)


        result = calculate_expected_value(
            loan_amount=loan_amount,
            interest_rate=apr,
            term_months=term_months,
            pd=pd,
            lgd=stressed_lgd,
        )
        return result.expected_value


    @staticmethod
    def is_robust(
        loan_amount: float,
        apr: float,
        term_months: int,
        pd: float,
        base_lgd: float,
    ) -> bool:
        return (
            StressTester.stressed_ev(
                loan_amount, apr, term_months, pd, base_lgd
            ) > 0
        )



