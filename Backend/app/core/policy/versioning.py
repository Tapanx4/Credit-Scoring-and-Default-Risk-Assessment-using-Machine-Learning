from dataclasses import dataclass
from datetime import date




@dataclass(frozen=True)
class PolicyVersion:
    """
    Immutable policy identifier.
    Stored with every Decision row for auditability.
    """


    id: str
    effective_date: date
    description: str




CURRENT_POLICY = PolicyVersion(
    id="POL-2025-001-BETA",
    effective_date=date(2025, 12, 18),
    description="Initial launch policy. IPW v1. Max PD 18%. EV floor $50. LGD stress +20%.",
)




def get_active_policy() -> PolicyVersion:
    return CURRENT_POLICY



