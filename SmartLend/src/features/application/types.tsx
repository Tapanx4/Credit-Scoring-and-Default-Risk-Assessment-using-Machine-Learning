// --------------------------------------------------
// Enums (MUST match backend exactly)
// --------------------------------------------------

export enum ApplicationStatus {
  CREATED = "CREATED",
  SUBMITTED = "SUBMITTED",
  SCORED = "SCORED",
  OFFERED = "OFFERED",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  DECLINED = "DECLINED",
  ACCEPTED = "ACCEPTED",
  FUNDED = "FUNDED",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  DEFAULTED = "DEFAULTED",
}

export enum RiskTier {
  TIER_AA = "A_AutoApprove_Prime",
  TIER_AB = "B_AutoApprove_NearPrime",
  TIER_M1 = "M1_ManualReview_EV_Positive",
  TIER_M2 = "M2_ManualReview_EV_Marginal",
  TIER_R1 = "R1_Reject_HighRisk",
  TIER_R2 = "R2_Reject_NegativeEV",
  TIER_R3 = "R3_Reject_Policy",
}

// --------------------------------------------------
// Payload Types (Backend-Compatible)
// --------------------------------------------------

export interface ApplicantData {
  ssn: string;
  annual_inc: number;
  emp_length_num: number;
  home_ownership: "RENT" | "OWN" | "MORTGAGE" | "OTHER" | "NONE";
  verification_status: "Verified" | "Source Verified" | "Not Verified";
  zip_region: string;
}

export interface LoanData {
  loan_amnt: number;
  term: number;
  purpose: string;
}

// --------------------------------------------------
// API Contracts
// --------------------------------------------------

export interface ApplicationResponse {
  id: string;
  user_id?: string;

  status: ApplicationStatus;
  current_tier?: RiskTier;

  economics?: {
    expected_value: number;
    pricing_apr: number;
  };

  decision?: {
    outcome: "APPROVE" | "DECLINE" | "MANUAL_REVIEW";
    tier: RiskTier;
    primary_decline_reason?: string;
  };

  risk_profile?: {
    credit_score: number;
    pd_raw: number;
  };

  approved_amount?: number;

  created_at: string;
  submitted_at?: string;
  decisioned_at?: string;
}

export interface CreateApplicationPayload {
  applicant: ApplicantData;
  loan: LoanData;
}
