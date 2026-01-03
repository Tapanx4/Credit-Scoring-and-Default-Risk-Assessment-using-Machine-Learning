# from fastapi import HTTPException, status

# def require_role(user: dict, allowed_roles: list[str]):
#     """
#     Enforces RBAC.
#     Checks 'app_metadata' in the Supabase user object for a 'role'.
#     """
#     # Extract role from Supabase metadata (set this up in Supabase Dashboard)
#     # Structure: user.app_metadata = {"role": "underwriter", ...}
#     user_role = user.app_metadata.get("role", "applicant") # Default to applicant
    
#     if user_role not in allowed_roles:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail=f"Access forbidden: User role '{user_role}' is not in {allowed_roles}"
#         )
    
#     return True   
# =============================================================
# auth/permissions.py — REVIEWED & HARDENED
# =============================================================
from fastapi import HTTPException, status
from typing import Iterable


def require_role(user, allowed_roles: Iterable[str]) -> None:
    """
    Enforces Role-Based Access Control (RBAC).

    Source of truth:
    - Supabase Auth JWT
    - user.app_metadata = {"role": "admin" | "underwriter" | "applicant"}

    This function is intentionally:
    - side-effect free
    - framework-agnostic
    """

    # Defensive access (Supabase user object is not a plain dict)
    app_metadata = getattr(user, "app_metadata", {}) or {}
    user_role = app_metadata.get("role", "applicant")

    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Access forbidden: role '{user_role}' is not permitted. "
                f"Allowed roles: {list(allowed_roles)}"
            ),
        )

    # Explicit None return (FastAPI dependency friendly)
    return None
