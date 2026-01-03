from typing import Dict, Any
from app.core.policy.versioning import get_active_policy
from app.core.config import settings

class PolicyService:
    """
    Read-only service to expose current policy configurations to the frontend.
    Allows the Admin Dashboard to display 'Current Rules'.
    """

    def get_active_policy_metadata(self) -> Dict[str, Any]:
        """
        Returns the currently active policy version and rules.
        """
        policy = get_active_policy()
        
        return {
            "policy_id": policy.id,
            "effective_date": policy.effective_date,
            "description": policy.description,
            "thresholds": {
                "max_pd_cutoff": settings.MAX_PD_CUTOFF,
                "min_profit_buffer": settings.MIN_PROFIT_BUFFER,
                "lgd_assumption": settings.LGD_ASSUMPTION
            }
        }