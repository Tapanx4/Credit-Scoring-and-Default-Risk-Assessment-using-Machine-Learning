# # # =============================================================
# # # services/override_service.py — AUDIT-SAFE OVERRIDES
# # # =============================================================
# # from sqlalchemy.orm import Session
# # from fastapi import HTTPException
# # from typing import Optional
# # import uuid
# # from datetime import datetime

# # from app.models.db.application import Application
# # from app.models.db.audit import AuditLog
# # from app.core.lifecycle.states import ApplicationStatus
# # from app.core.lifecycle.transitions import validate_transition


# # class OverrideService:
# #     """
# #     Handles all human overrides.
# #     Every action is validated and audited.
# #     """

# #     def __init__(self, db: Session):
# #         self.db = db

# #     def approve_application(
# #         self,
# #         application_id: uuid.UUID,
# #         actor_id: str,
# #         reason: str,
# #         notes: Optional[str] = None,
# #     ) -> Application:
# #         app = self._get_app(application_id)

# #         self._transition_with_audit(
# #             app,
# #             ApplicationStatus.OFFERED,
# #             actor_id,
# #             action="MANUAL_APPROVE",
# #             details={"reason": reason, "notes": notes},
# #         )

# #         app.decisioned_at = datetime.utcnow()
# #         self.db.commit()
# #         self.db.refresh(app)
# #         return app

# #     def decline_application(
# #         self,
# #         application_id: uuid.UUID,
# #         actor_id: str,
# #         reason_code: str,
# #         notes: Optional[str] = None,
# #     ) -> Application:
# #         app = self._get_app(application_id)

# #         self._transition_with_audit(
# #             app,
# #             ApplicationStatus.DECLINED,
# #             actor_id,
# #             action="MANUAL_DECLINE",
# #             details={"reason_code": reason_code, "notes": notes},
# #         )

# #         app.primary_decline_reason = reason_code
# #         app.decisioned_at = datetime.utcnow()
# #         self.db.commit()
# #         self.db.refresh(app)
# #         return app

# #     # -----------------------------
# #     # Internal helpers
# #     # -----------------------------
# #     def _get_app(self, app_id: uuid.UUID) -> Application:
# #         app = self.db.query(Application).filter(Application.id == app_id).first()
# #         if not app:
# #             raise HTTPException(status_code=404, detail="Application not found")
# #         return app

# #     def _transition_with_audit(
# #         self,
# #         app: Application,
# #         target_status: ApplicationStatus,
# #         actor_id: str,
# #         action: str,
# #         details: dict,
# #     ):
# #         try:
# #             validate_transition(app.status, target_status)
# #         except ValueError as e:
# #             raise HTTPException(status_code=400, detail=f"Illegal override: {str(e)}")

# #         old_status = app.status
# #         app.status = target_status

# #         log = AuditLog(
# #             application_id=app.id,
# #             actor_id=actor_id,
# #             action=action,
# #             details={"from": old_status, **details},
# #         )
# #         self.db.add(log)
# from sqlalchemy.orm import Session
# from fastapi import HTTPException
# from typing import Optional
# import uuid
# from datetime import datetime
# from app.core.economics import expected_value, pricing, lgd
# from app.models.db.application import Application
# from app.models.db.audit import AuditLog
# from app.core.lifecycle.states import ApplicationStatus, RiskTier
# from app.core.lifecycle.transitions import validate_transition

# class OverrideService:
#     """
#     Handles human overrides and manual review decisions.
#     Strictly enforcing audit trails for every manual action.
#     """

#     def __init__(self, db: Session):
#         self.db = db

#     def approve_application(self, application_id: uuid.UUID, actor_id: str, reason: str, notes: Optional[str] = None):
#         """
#         Underwriter manually approves a loan.
#         Transition: * -> OFFERED
#         Action: Sets Tier to 'Manual_Override'
#         """
#         app = self._get_app(application_id)
        
#         # Validate Move
#         self._validate_manual_action(app, ApplicationStatus.OFFERED)

#         # Execute Transition
#         old_status = app.status
#         app.status = ApplicationStatus.OFFERED
        
#         # KEY UPDATE: Mark as Manual Override so we track performance separately
#         app.current_tier = RiskTier.TIER_MANUAL_OVERRIDE
        
#         app.decisioned_at = datetime.utcnow()
#         # Import the economic engine

#     # ... inside approve_application method ...

#         # 1. Update Status
#         app.status = ApplicationStatus.OFFERED
#         app.current_tier = RiskTier.TIER_MANUAL_OVERRIDE

#         # 2. RE-CALCULATE ECONOMICS (The Missing Step)
#         # When overriding, we might want to force a specific APR or just re-run with the 'Approved' assumption
#         # Here we re-run using the model's PD but ensure we get valid economics
        
#         current_pd = app.pd_raw or 0.05 # Fallback if missing
        
#         # Get APR (You might want a custom 'Override APR' here)
#         new_apr, _ = pricing.get_risk_based_pricing(current_pd)
#         credit_data = app.input_data.get('credit_bureau', {})
#         grade = credit_data.get('grade', 'C')
        
#         # Calculate LGD based on the actual grade
#         current_lgd = lgd.get_lgd(grade)
#         # Re-run Math
#         econ_result = expected_value.calculate_expected_value(
#             loan_amount=app.input_data['loan']['amount'],
#             interest_rate=new_apr,
#             term_months=app.input_data['loan']['term'],
#             pd=current_pd,
#             lgd=current_lgd
#             #lgd=lgd.get_lgd(app.risk_profile.get('grade')) # You might need to fetch grade from input_data or risk_profile
#         )
        
#         # 3. Save New Values to DB
#         app.pricing_apr = new_apr
#         app.expected_value = econ_result.expected_value
        
#     # ... then log audit and commit ...
#         # Log Audit
#         self._log_override(
#             app.id, 
#             actor_id, 
#             "MANUAL_APPROVE", 
#             {
#                 "from": old_status, 
#                 "reason": reason, 
#                 "notes": notes,
#                 "tier_change": "Manual_Override"
#             }
#         )
        
#         self.db.commit()
#         self.db.refresh(app)
#         return app

#     def decline_application(self, application_id: uuid.UUID, actor_id: str, reason_code: str, notes: Optional[str] = None):
#         """
#         Underwriter manually declines a loan.
#         """
#         app = self._get_app(application_id)
        
#         self._validate_manual_action(app, ApplicationStatus.DECLINED)

#         old_status = app.status
#         app.status = ApplicationStatus.DECLINED
#         app.primary_decline_reason = reason_code
#         app.decisioned_at = datetime.utcnow()

#         self._log_override(
#             app.id, 
#             actor_id, 
#             "MANUAL_DECLINE", 
#             {"from": old_status, "reason_code": reason_code, "notes": notes}
#         )

#         self.db.commit()
#         self.db.refresh(app)
#         return app

#     def _get_app(self, app_id: uuid.UUID) -> Application:
#         app = self.db.query(Application).filter(Application.id == app_id).first()
#         if not app:
#             raise HTTPException(status_code=404, detail="Application not found")
#         return app

#     def _validate_manual_action(self, app: Application, target_status: ApplicationStatus):
#         try:
#             validate_transition(app.status, target_status)
#         except ValueError as e:
#             raise HTTPException(status_code=400, detail=f"Illegal Override: {str(e)}")

#     def _log_override(self, app_id: uuid.UUID, actor: str, action: str, details: dict):
#         log = AuditLog(
#             application_id=app_id,
#             actor_id=actor,
#             action=action,
#             details=details
#         )
#         self.db.add(log)
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
import uuid
from datetime import datetime

from app.models.db.application import Application
from app.models.db.audit import AuditLog
from app.core.lifecycle.states import ApplicationStatus, RiskTier
from app.core.lifecycle.transitions import validate_transition

# Import Economic Engine to allow recalculation
from app.core.economics import pricing, expected_value, lgd

class OverrideService:
    """
    Handles human overrides and manual review decisions.
    Strictly enforcing audit trails for every manual action.
    """

    def __init__(self, db: Session):
        self.db = db

    def approve_application(self, application_id: uuid.UUID, actor_id: str, reason: str, notes: Optional[str] = None):
        """
        Underwriter manually approves a loan.
        Transition: * -> OFFERED
        Action: Sets Tier to 'Manual_Override' & Recalculates Economics
        """
        app = self._get_app(application_id)
        
        # 1. Validate Move
        self._validate_manual_action(app, ApplicationStatus.OFFERED)

        # 2. Update Status & Tier
        old_status = app.status
        app.status = ApplicationStatus.OFFERED
        # Flag this as a human override so we can track it separately from model approvals
        app.current_tier = RiskTier.TIER_MANUAL_OVERRIDE 
        app.decisioned_at = datetime.utcnow()

        # 3. RE-CALCULATE ECONOMICS
        # We re-run the math to ensure the Offer Dashboard has valid data (APR, Payment, etc.)
        # even if the model originally declined it (and potentially didn't save an offer).
        
        # Fallback to 5% risk if model failed to score (unlikely at this stage)
        current_pd = app.pd_raw or 0.05 
        
        # Get Grade from stored input data (Credit Bureau) to ensure accurate LGD
        # Fallback to 'C' only if data is missing
        # Handle nested or flat structure for credit_bureau
        credit_data = app.input_data.get('credit_bureau', {})
        if not credit_data and 'fico_score' in app.input_data:
             credit_data = app.input_data # Handle flat structure if present
        
        grade = credit_data.get('grade', 'C')
        
        # Calculate LGD based on the actual grade
        current_lgd = lgd.get_lgd(grade)

        # Calculate APR based on the PD (Risk-Based Pricing)
        new_apr, _ = pricing.get_risk_based_pricing(current_pd)
        
        # Safe extraction of loan amount and term
        loan_data = app.input_data.get('loan', {})
        
        # Handle different key names (amount vs loan_amnt)
        amount = loan_data.get('amount') or loan_data.get('loan_amnt') or app.input_data.get('loan_amnt')
        term = loan_data.get('term') or app.input_data.get('term') or 36
        
        if not amount:
             # Last resort fallback if data is malformed
             raise ValueError(f"Could not find loan amount in application data: {app.input_data.keys()}")

        # Run Math to get Net EV, Profit Good (Interest), and Loss Bad
        econ_result = expected_value.calculate_expected_value(
            loan_amount=float(amount),
            interest_rate=new_apr,
            term_months=int(term),
            pd=current_pd,
            lgd=current_lgd
        )
        
        # 4. Persist New Economics to DB
        app.pricing_apr = new_apr
        app.expected_value = econ_result.expected_value
        
        # Ensure approved_amount is set (if it was nullified by a decline)
        if not app.approved_amount:
             app.approved_amount = float(amount)
        
        # 5. Log Audit
        self._log_override(
            app.id, 
            actor_id, 
            "MANUAL_APPROVE", 
            {
                "from": old_status, 
                "reason": reason, 
                "notes": notes,
                "tier_change": "Manual_Override",
                "new_apr": new_apr,
                "new_ev": econ_result.expected_value,
                "projected_interest_component": econ_result.profit_good,
                "expected_loss_component": econ_result.loss_bad
            }
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app

    def decline_application(self, application_id: uuid.UUID, actor_id: str, reason_code: str, notes: Optional[str] = None):
        """
        Underwriter manually declines a loan.
        """
        app = self._get_app(application_id)
        
        self._validate_manual_action(app, ApplicationStatus.DECLINED)

        old_status = app.status
        app.status = ApplicationStatus.DECLINED
        app.primary_decline_reason = reason_code
        app.decisioned_at = datetime.utcnow()

        self._log_override(
            app.id, 
            actor_id, 
            "MANUAL_DECLINE", 
            {"from": old_status, "reason_code": reason_code, "notes": notes}
        )

        self.db.commit()
        self.db.refresh(app)
        return app

    def _get_app(self, app_id: uuid.UUID) -> Application:
        app = self.db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app

    def _validate_manual_action(self, app: Application, target_status: ApplicationStatus):
        try:
            validate_transition(app.status, target_status)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Illegal Override: {str(e)}")

    def _log_override(self, app_id: uuid.UUID, actor: str, action: str, details: dict):
        log = AuditLog(
            application_id=app_id,
            actor_id=actor,
            action=action,
            details=details
        )
        self.db.add(log)