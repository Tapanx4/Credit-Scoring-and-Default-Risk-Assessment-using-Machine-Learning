
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime
import re
from app.core.lifecycle.states import ApplicationStatus, RiskTier, DecisionOutcome

# --- Base Shared Properties ---
class ApplicantBase(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    ssn: str = Field(..., description="Social Security Number (9 digits)")
    
    annual_income: float = Field(..., gt=0, description="Annual Income in USD")
    emp_length: int = Field(..., ge=0, le=40, description="Years of employment")
    emp_category: Optional[str] = Field(None, description="Industry/Job Category") 

    home_ownership: str = Field(..., description="RENT, OWN, MORTGAGE")
    zip_code: str = Field(..., min_length=3, max_length=10)
    address_state: str = Field(..., min_length=2, max_length=2)

    @field_validator("ssn")
    def validate_ssn(cls, v):
        clean_ssn = re.sub(r"\D", "", v)
        if len(clean_ssn) != 9:
            raise ValueError("SSN must be exactly 9 digits")
        return clean_ssn

class LoanRequest(BaseModel):
    amount: float = Field(..., ge=1000, description="Requested Loan Amount")
    term: int = Field(36, description="Requested Term (months)")
    purpose: str = Field(..., description="debt_consolidation, credit_card, etc.")

# --- Request Schema ---
class ApplicationCreate(BaseModel):
    applicant: ApplicantBase
    loan: LoanRequest
    credit_bureau: Optional[Dict[str, Any]] = None 

# --- Embedded Response Schemas ---
class EconomicsSnapshot(BaseModel):
    expected_value: Optional[float] = None
    pricing_apr: Optional[float] = None

class DecisionSnapshot(BaseModel):
    outcome: Optional[DecisionOutcome] = None
    tier: Optional[RiskTier] = None
    primary_decline_reason: Optional[str] = None

class RiskProfileSnapshot(BaseModel):
    pd_raw: Optional[float] = None
    credit_score: Optional[int] = None

# --- Response Schema ---
class ApplicationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None

    status: ApplicationStatus
    current_tier: Optional[RiskTier] = None
    
    # Expose raw inputs for UI display (Profile, Income, etc.)
    input_data: Optional[Dict[str, Any]] = None
    documents: Optional[List[Dict[str, Any]]] = None 

    economics: Optional[EconomicsSnapshot] = None
    decision: Optional[DecisionSnapshot] = None
    risk_profile: Optional[RiskProfileSnapshot] = None

    approved_amount: Optional[float] = None

    created_at: datetime
    submitted_at: Optional[datetime] = None
    decisioned_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm(cls, app):
        return cls(
            id=str(app.id),
            user_id=str(app.user_id) if app.user_id else None,
            status=app.status,
            current_tier=app.current_tier,
            approved_amount=app.approved_amount,
            
            # Map the JSON column to the response field
            input_data=app.input_data,
            documents=app.documents, 

            economics=EconomicsSnapshot(
                expected_value=app.expected_value,
                pricing_apr=app.pricing_apr,
            ),
            
            decision=DecisionSnapshot(
                outcome=DecisionOutcome.DECLINE if app.primary_decline_reason else DecisionOutcome.APPROVE, 
                tier=app.current_tier,
                primary_decline_reason=app.primary_decline_reason,
            ),
            
            risk_profile=RiskProfileSnapshot(
                pd_raw=app.pd_raw,
                credit_score=app.credit_score
            ),

            created_at=app.created_at,
            submitted_at=app.submitted_at,
            decisioned_at=app.decisioned_at,
        )
