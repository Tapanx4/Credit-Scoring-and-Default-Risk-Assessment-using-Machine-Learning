# # =============================================================
# # models/schema/application.py — FINAL, BUREAU-AWARE CONTRACT
# # =============================================================
# from pydantic import BaseModel, ConfigDict, field_validator
# from typing import Dict, Any, Optional
# from datetime import datetime

# from app.core.lifecycle.states import (
#     ApplicationStatus,
#     RiskTier,
#     DecisionOutcome,
# )


# # -------------------------------------------------
# # Request Schema
# # -------------------------------------------------
# class ApplicationCreate(BaseModel):
#     """
#     Payload submitted by applicant.
#     Stored verbatim in Application.input_data.
#     """
#     applicant: Dict[str, Any]
#     loan: Dict[str, Any]

#     @field_validator("applicant")
#     @classmethod
#     def validate_ssn(cls, v: Dict[str, Any]):
#         ssn = v.get("ssn")
#         if not ssn:
#             raise ValueError("SSN is required for credit evaluation")
#         normalized = ssn.replace("-", "")
#         if len(normalized) != 9 or not normalized.isdigit():
#             raise ValueError("Invalid SSN format")
#         return v


# # -------------------------------------------------
# # Embedded Schemas
# # -------------------------------------------------
# class EconomicsSnapshot(BaseModel):
#     expected_value: Optional[float]
#     pricing_apr: Optional[float]


# class DecisionSnapshot(BaseModel):
#     outcome: DecisionOutcome
#     tier: Optional[RiskTier]
#     primary_decline_reason: Optional[str]


# # -------------------------------------------------
# # Response Schema
# # -------------------------------------------------
# class ApplicationResponse(BaseModel):
#     """
#     Public-facing application view.
#     Safe for applicants, underwriters, and admins.
#     """

#     id: str
#     user_id: Optional[str]

#     status: ApplicationStatus
#     current_tier: Optional[RiskTier]

#     economics: EconomicsSnapshot
#     decision: Optional[DecisionSnapshot]

#     created_at: datetime
#     submitted_at: Optional[datetime]
#     decisioned_at: Optional[datetime]

#     model_config = ConfigDict(from_attributes=True)

#     @classmethod
#     def from_orm(cls, app):
#         # Derive decision outcome from lifecycle state
#         if app.status == ApplicationStatus.DECLINED:
#             outcome = DecisionOutcome.DECLINE
#         elif app.status == ApplicationStatus.MANUAL_REVIEW:
#             outcome = DecisionOutcome.MANUAL_REVIEW
#         elif app.status == ApplicationStatus.OFFERED:
#             outcome = DecisionOutcome.APPROVE
#         else:
#             outcome = None

#         return cls(
#             id=str(app.id),
#             user_id=app.user_id,
#             status=app.status,
#             current_tier=app.current_tier,
#             economics=EconomicsSnapshot(
#                 expected_value=app.expected_value,
#                 pricing_apr=app.pricing_apr,
#             ),
#             decision=(
#                 DecisionSnapshot(
#                     outcome=outcome,
#                     tier=app.current_tier,
#                     primary_decline_reason=app.primary_decline_reason,
#                 )
#                 if app.decisioned_at
#                 else None
#             ),
#             created_at=app.created_at,
#             submitted_at=app.submitted_at,
#             decisioned_at=app.decisioned_at,
#         )
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
    amount: float = Field(..., gt=1000, description="Requested Loan Amount")
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
