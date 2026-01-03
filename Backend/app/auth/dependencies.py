# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from supabase.client import Client
# from app.auth.client import get_supabase

# # The "Lock" on the door
# security = HTTPBearer()

# def get_current_user(
#     credentials: HTTPAuthorizationCredentials = Depends(security),
#     supabase: Client = Depends(get_supabase)
# ) -> dict:
#     """
#     Validates the Bearer Token against Supabase Auth.
#     Returns the user dictionary (id, email, app_metadata) if valid.
#     """
#     token = credentials.credentials
    
#     try:
#         # This calls Supabase Auth server to verify the token signature & expiration
#         user_response = supabase.auth.get_user(token)
#         user = user_response.user
        
#         if not user:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Invalid authentication credentials"
#             )
            
#         return user

#     except Exception as e:
#         # Catch expired tokens, bad signatures, etc.
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail=f"Authentication failed: {str(e)}"
#         ) 
# =============================================================
# auth/dependencies.py — REVIEWED & PROD-SAFE
# =============================================================
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase.client import Client

from app.auth.client import get_supabase

# HTTP Bearer auth scheme
security = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase),
):
    """
    Validates the Bearer JWT against Supabase Auth.

    Returns:
        Supabase User object (NOT a dict):
        - user.id
        - user.email
        - user.app_metadata

    Raises:
        401 if token is invalid / expired
    """

    token = credentials.credentials

    try:
        # Supabase verifies signature + expiry
        response = supabase.auth.get_user(token)
        user = response.user

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token",
            )

        return user

    except HTTPException:
        # Bubble up explicit HTTP errors
        raise
    except Exception as exc:
        # Catch-all for JWT decode, network, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        ) from exc
