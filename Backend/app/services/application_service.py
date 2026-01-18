from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
import hashlib

from app.models.db.application import Application
from app.models.db.decision import Decision
from app.models.db.audit import AuditLog
from app.models.schemas.application import ApplicationCreate

from app.core.decisioning.decision_engine import DecisionEngine
from app.core.lifecycle.states import ApplicationStatus, DecisionOutcome
from app.core.lifecycle.transitions import validate_transition
from app.services.credit_bureau_service import CreditBureauService

def normalize_json(obj):
    if isinstance(obj, dict):
        return {k: normalize_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_json(v) for v in obj]
    if hasattr(obj, "item"):  # numpy scalar
        return obj.item()
    return obj


class ApplicationService:
    """
    Stateful orchestration layer.
    Owns lifecycle transitions, persistence, and audit logging.
    """

    def __init__(self, db: Session):
        self.db = db
        self.engine = DecisionEngine()
        self.bureau = CreditBureauService()

    def get_application_by_id(self, app_id: uuid.UUID) -> Application:
        app = self.db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app
    # --- DOCUMENT HANDLING (NEW) ---
    def attach_document(self, application_id: uuid.UUID, doc_metadata: Dict[str, Any], actor_id: str) -> Application:
        """
        Saves document metadata (URL, name) to the application record.
        """
        app = self.get_application_by_id(application_id)
        
        # Initialize list if None
        current_docs = app.documents or []
        
        # Add metadata
        doc_metadata["uploaded_at"] = datetime.utcnow().isoformat()
        doc_metadata["uploaded_by"] = actor_id
        
        # SQLAlchemy JSON mutation requires creating a new list to trigger update
        updated_docs = list(current_docs)
        updated_docs.append(doc_metadata)
        app.documents = updated_docs
        
        # Audit log
        self._log_audit(
            app_id=app.id,
            actor=actor_id,
            action="DOCUMENT_UPLOAD",
            details={"filename": doc_metadata.get("name")}
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app

    # =============================================================
    # 1. APPLICATION CREATION
    # =============================================================
    def create_application(
        self, payload: ApplicationCreate, user_id: Optional[str] = None
    ) -> Application:

        input_data = payload.model_dump()

        # --- CREDIT BUREAU ENRICHMENT ---
        if input_data.get("credit_bureau") is None:
            applicant = input_data.get("applicant", {})
            ssn = applicant.get("ssn")

            if not ssn:
                # Fallback to email if SSN missing (dev/testing convenience)
                # But strictly speaking, schema requires SSN.
                pass 
                
            # We pass the applicant dict (containing ssn/email) to pull_report
            # CreditBureauService.pull_report handles the logic
            bureau_data = self.bureau.pull_report(applicant)
            input_data["credit_bureau"] = bureau_data

        db_app = Application(
            user_id=user_id,
            input_data=normalize_json(input_data),
            status=ApplicationStatus.CREATED,
        )

        self.db.add(db_app)
        self.db.commit()
        self.db.refresh(db_app)

        self._log_audit(
            app_id=db_app.id,
            actor=user_id or "SYSTEM",
            action="APPLICATION_CREATED",
            details={"schema": payload.__class__.__name__},
        )
        return db_app

    # =============================================================
    # 2. SUBMIT + SCORE
    # =============================================================
    def submit_and_score(self, application_id: uuid.UUID) -> Application:
        db_app = self.get_application_by_id(application_id)

        self._transition(db_app, ApplicationStatus.SUBMITTED, actor="SYSTEM")
        db_app.submitted_at = datetime.utcnow()

        try:
            # Prepare input for Decision Engine
            # We need to ensure 'amount' and 'term' are top-level for Economics
            # while keeping nested structure for FeatureBuilder
            decision_input = dict(db_app.input_data)  # shallow copy
            loan = decision_input.get("loan", {})
            
            # Map loan fields to expected top-level keys if needed by Engine validation
            decision_input["amount"] = loan.get("loan_amnt") or loan.get("amount")
            decision_input["term"] = loan.get("term", 36)

            decision = self.engine.decide(decision_input)

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Decision engine failure: {str(e)}",
            )

        self._transition(db_app, ApplicationStatus.SCORED, actor="SYSTEM")
        db_app.decisioned_at = datetime.utcnow()

        self._apply_decision_to_app(db_app, decision)
        
        tier = decision["tier"]
        
        db_decision = Decision(
            application_id=db_app.id,
            outcome=decision["decision"],
            assigned_tier=tier.value if hasattr(tier, "value") else tier,
            model_version=decision["risk_profile"].get("model_version", "unknown"),
            pd_probability=db_app.pd_raw or 0.0,
            expected_value=db_app.expected_value or 0.0,
            input_snapshot=db_app.input_data,
        )

        self.db.add(db_decision)
        self._route_post_decision(db_app, decision["decision"])
        
        self.db.commit()
        self.db.refresh(db_app)
        return db_app

    # =============================================================
    # 3. OFFER ACTIONS (ACCEPT / DECLINE)
    # =============================================================
    def accept_offer(self, application_id: uuid.UUID, actor_id: str) -> Application:
        """
        Applicant accepts the offer.
        Transition: OFFERED -> ACCEPTED
        """
        app = self.get_application_by_id(application_id)
        
        # 1. State Transition (Validates logic)
        self._transition(app, ApplicationStatus.ACCEPTED, actor=actor_id)
        
        # 2. Log Audit
        self._log_audit(
            app_id=app.id,
            actor=actor_id,
            action="OFFER_ACCEPTED",
            details={
                "amount": app.approved_amount,
                "apr": app.pricing_apr,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app

    def decline_offer(self, application_id: uuid.UUID, actor_id: str) -> Application:
        """
        Applicant declines the offer.
        Transition: OFFERED -> DECLINED
        """
        app = self.get_application_by_id(application_id)
        
        # 1. State Transition
        self._transition(app, ApplicationStatus.DECLINED, actor=actor_id)
        
        # 2. Log Audit
        self._log_audit(
            app_id=app.id,
            actor=actor_id,
            action="OFFER_DECLINED_BY_USER",
            details={"timestamp": datetime.utcnow().isoformat()}
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app

    # =============================================================
    # 4. ADMIN & LIST ACTIONS
    # =============================================================
    def re_score(self, application_id: uuid.UUID, actor_id: str) -> Application:
        """
        Manual trigger to re-run scoring.
        """
        db_app = self.get_application_by_id(application_id)
        
        self._log_audit(
            app_id=db_app.id,
            actor=actor_id,
            action="MANUAL_RE_SCORE_INIT",
            details={"original_status": db_app.status}
        )

        # Prepare input same as submit_and_score
        decision_input = dict(db_app.input_data)
        loan = decision_input.get("loan", {})
        decision_input["amount"] = loan.get("loan_amnt") or loan.get("amount")
        decision_input["term"] = loan.get("term", 36)

        decision = self.engine.decide(decision_input)

        self._apply_decision_to_app(db_app, decision)

        tier = decision["tier"]
        db_decision = Decision(
            application_id=db_app.id,
            outcome=decision["decision"],
            assigned_tier=tier.value if hasattr(tier, "value") else tier,
            model_version=decision["risk_profile"].get("model_version", "unknown"),
            pd_probability=db_app.pd_raw or 0.0,
            expected_value=db_app.expected_value or 0.0,
            input_snapshot=db_app.input_data,
        )
        self.db.add(db_decision)

        # Only auto-route if currently in a decisioning state
        if db_app.status in [ApplicationStatus.SCORED, ApplicationStatus.MANUAL_REVIEW]:
             self._route_post_decision(db_app, decision["decision"])

        self.db.commit()
        self.db.refresh(db_app)
        return db_app

    def list_applications_for_user(self, user_id: str, limit: int = 50) -> List[Application]:
        # Handle string vs UUID mismatch if necessary
        return (
            self.db.query(Application)
            .filter(Application.user_id == str(user_id)) # Supabase IDs are strings (UUID format)
            .order_by(Application.created_at.desc())
            .limit(limit)
            .all()
        )

    def list_recent_applications(self, limit: int = 20) -> List[Application]:
        return (
            self.db.query(Application)
            .order_by(Application.updated_at.desc())
            .limit(limit)
            .all()
        )

    # =============================================================
    # INTERNAL HELPERS
    # =============================================================
    def _apply_decision_to_app(self, db_app: Application, decision: dict):
        tier = decision.get("tier")

        db_app.current_tier = (
            tier.value if hasattr(tier, "value") else tier
        )
        
        db_app.credit_score = decision["risk_profile"].get("score")
        db_app.pd_raw = decision["risk_profile"].get("calibrated_pd")
        db_app.expected_value = decision["economics"].get("expected_value")
        db_app.pricing_apr = decision["economics"].get("pricing_apr")

        if decision.get("offer"):
            db_app.approved_amount = decision["offer"]["amount"]

        reason = decision.get("decline_reason")
        # Handle Enum or String
        db_app.primary_decline_reason = (
            reason.value if hasattr(reason, "value") else reason
        )

    def _transition(self, app: Application, new_status: ApplicationStatus, actor: str):
        validate_transition(app.status, new_status)
        old_status = app.status
        app.status = new_status
        self._log_audit(
            app_id=app.id,
            actor=actor,
            action="STATUS_CHANGE",
            details={"from": old_status, "to": new_status},
        )

    def _route_post_decision(self, app: Application, outcome: DecisionOutcome):
        if outcome == DecisionOutcome.DECLINE:
            self._transition(app, ApplicationStatus.DECLINED, actor="SYSTEM")
        elif outcome == DecisionOutcome.APPROVE:
            self._transition(app, ApplicationStatus.OFFERED, actor="SYSTEM")
        elif outcome == DecisionOutcome.MANUAL_REVIEW:
            self._transition(app, ApplicationStatus.MANUAL_REVIEW, actor="SYSTEM")

    def _log_audit(self, app_id: uuid.UUID, actor: str, action: str, details: Dict[str, Any]):
        log = AuditLog(
            application_id=app_id,
            actor_id=actor,
            action=action,
            details=details,
        )
        self.db.add(log)
    

    def request_documents(self, application_id: uuid.UUID, actor_id: str) -> Application:
        """
        Underwriter requests documents from the applicant.
        Sets a flag in input_data to trigger UI changes on frontend.
        """
        app = self.get_application_by_id(application_id)
        
        # Update metadata in input_data (using dict copy to ensure SQLAlchemy detects change)
        new_input = dict(app.input_data)
        new_input['docs_status'] = 'REQUESTED' 
        app.input_data = new_input
        
        self._log_audit(
            app_id=app.id,
            actor=actor_id,
            action="DOCUMENTS_REQUESTED",
            details={"timestamp": datetime.utcnow().isoformat()}
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app

    # --- DOCUMENT HANDLING (FIXED RETURN) ---
    def attach_document(self, application_id: uuid.UUID, doc_metadata: Dict[str, Any], actor_id: str) -> Application:
        """
        Saves document metadata (URL, name) to the application record.
        """
        app = self.get_application_by_id(application_id)
        
        # Initialize list if None
        current_docs = app.documents or []
        
        # Add metadata
        doc_metadata["uploaded_at"] = datetime.utcnow().isoformat()
        doc_metadata["uploaded_by"] = actor_id
        
        # Append and Save (SQLAlchemy needs explicit reassignment for Mutable Types sometimes)
        updated_docs = list(current_docs)
        updated_docs.append(doc_metadata)
        app.documents = updated_docs
        
        # Update status if needed (REQUESTED -> RECEIVED)
        if app.input_data.get('docs_status') == 'REQUESTED':
            new_input = dict(app.input_data)
            new_input['docs_status'] = 'RECEIVED'
            app.input_data = new_input
        
        # Log Audit
        self._log_audit(
            app_id=app.id,
            actor=actor_id,
            action="DOCUMENT_UPLOAD",
            details={"filename": doc_metadata.get("name")}
        )
        
        self.db.commit()
        self.db.refresh(app)
        return app  # <--- CRITICAL FIX: Ensure app is returned
    def fund_application(self, application_id: uuid.UUID, actor_id: str) -> Application:
        """
        Admin action to disburse funds.
        Transition: ACCEPTED -> FUNDED
        """
        app = self.get_application_by_id(application_id)
        self._transition(app, ApplicationStatus.FUNDED, actor=actor_id)
        app.funded_at = datetime.utcnow()
        self._log_audit(app.id, actor_id, "LOAN_FUNDED", {"amount": app.approved_amount})
        self.db.commit()
        self.db.refresh(app)
        return app
