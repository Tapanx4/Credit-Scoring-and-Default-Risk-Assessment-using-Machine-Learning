# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
# from pydantic import BaseModel, EmailStr
# from supabase import create_client, Client
# from app.core.config import settings
# from app.auth.dependencies import get_current_user
# from app.auth.permissions import require_role
# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart
# import os

# router = APIRouter()

# # -----------------------------
# # SCHEMA
# # -----------------------------
# class CreateUserRequest(BaseModel):
#     email: EmailStr
#     password: str
#     full_name: str
#     role: str = "underwriter"
#     force_password_change: bool = True

# # -----------------------------
# # CLIENT (Service Role)
# # -----------------------------
# # ⚠️ This key allows bypassing RLS. Use with caution.
# if not settings.SUPABASE_SERVICE_ROLE_KEY:
#     print("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin user creation will fail.")

# supabase_admin: Client = create_client(
#     settings.SUPABASE_URL, 
#     settings.SUPABASE_SERVICE_ROLE_KEY
# )

# # -----------------------------
# # EMAIL HELPER
# # -----------------------------
# def send_credentials_email(to_email: str, password: str, name: str):
#     """
#     Sends the welcome email with temporary credentials.
#     Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in env.
#     Falls back to console print in Dev.
#     """
#     # Defaults updated with provided Resend credentials
#     # Note: Using Port 587 for STARTTLS compatibility
#     smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
#     smtp_port = os.getenv("SMTP_PORT", "587")
#     smtp_user = os.getenv("SMTP_USER", "resend")
#     smtp_pass = os.getenv("SMTP_PASSWORD", "re_4Eno2sij_LQmrXYmLpJcMUErwpuD11nSX")
#     from_email = os.getenv("SMTP_FROM", "onboarding@resend.dev")

#     subject = "Welcome to SmartLend - Your Staff Credentials"
#     body = f"""
#     Hello {name},

#     Your staff account for the SmartLend Underwriting Portal has been created.

#     Here are your temporary credentials:
#     --------------------------------------------------
#     Email:    {to_email}
#     Password: {password}
#     --------------------------------------------------

#     Please log in immediately at: {os.getenv("FRONTEND_URL", "http://localhost:3000")}/login

#     Security Note: You will be required to change this password upon your first login.

#     Regards,
#     SmartLend Admin Team
#     """

#     if not (smtp_host and smtp_user and smtp_pass):
#         print(f"\n[DEV MODE] SMTP not configured. Mocking email to {to_email}:")
#         print("-" * 40)
#         print(body)
#         print("-" * 40)
#         return

#     try:
#         msg = MIMEMultipart()
#         msg['From'] = from_email
#         msg['To'] = to_email
#         msg['Subject'] = subject
#         msg.attach(MIMEText(body, 'plain'))

#         server = smtplib.SMTP(smtp_host, int(smtp_port))
#         server.starttls()
#         server.login(smtp_user, smtp_pass)
#         server.send_message(msg)
#         server.quit()
#         print(f"✅ Credentials emailed to {to_email}")
#     except Exception as e:
#         print(f"❌ Failed to send email: {e}")
#         # We log but don't crash the request because the user was created successfully
        
# # -----------------------------
# # ENDPOINT
# # -----------------------------
# @router.post("/users")
# def create_staff_user(
#     user_data: CreateUserRequest,
#     background_tasks: BackgroundTasks,
#     current_user = Depends(get_current_user)
# ):
#     """
#     Creates a new user in Supabase Auth with a specific role.
#     Sends credentials via email.
#     Only accessible by ADMINs.
#     """
#     # 1. Security Check
#     require_role(current_user, ["admin"])

#     try:
#         # 2. Create User via Supabase Admin API
#         # We auto-confirm the email so they can log in immediately with the password we set.
#         response = supabase_admin.auth.admin.create_user({
#             "email": user_data.email,
#             "password": user_data.password,
#             "email_confirm": True, # Auto-confirm
#             "user_metadata": {
#                 "full_name": user_data.full_name,
#                 "role": user_data.role,
#                 "force_password_change": user_data.force_password_change
#             }
#         })
        
#         # 3. Send Email (Background Task to avoid blocking API response)
#         background_tasks.add_task(
#             send_credentials_email, 
#             user_data.email, 
#             user_data.password, 
#             user_data.full_name
#         )
        
#         return {
#             "message": "User created successfully. Credentials queued for email.", 
#             "user_id": response.user.id
#         }

#     except Exception as e:
#         # Check for specific Supabase errors (like "User already exists")
#         error_msg = str(e)
#         if "already registered" in error_msg:
#             raise HTTPException(status_code=400, detail="User with this email already exists.")
        
#         raise HTTPException(status_code=400, detail=f"Failed to create user: {error_msg}")
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from app.core.config import settings
from app.auth.dependencies import get_current_user
from app.auth.permissions import require_role
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter()

# -----------------------------
# SCHEMA
# -----------------------------
class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "underwriter"
    force_password_change: bool = True

# -----------------------------
# CLIENT (Service Role)
# -----------------------------
if not settings.SUPABASE_SERVICE_ROLE_KEY:
    print("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Admin user creation will fail.")

supabase_admin: Client = create_client(
    settings.SUPABASE_URL, 
    settings.SUPABASE_SERVICE_ROLE_KEY
)

# -----------------------------
# EMAIL HELPER
# -----------------------------
def send_credentials_email(to_email: str, password: str, name: str):
    """
    Sends the welcome email with temporary credentials.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "resend")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", "onboarding@resend.dev")

    subject = "Welcome to SmartLend - Your Staff Credentials"
    body = f"""
    Hello {name},

    Your staff account for the SmartLend Underwriting Portal has been created.

    Here are your temporary credentials:
    --------------------------------------------------
    Email:    {to_email}
    Password: {password}
    --------------------------------------------------

    Please log in immediately at: {os.getenv("FRONTEND_URL", "http://localhost:3000")}/login

    Security Note: You will be required to change this password upon your first login.

    Regards,
    SmartLend Admin Team
    """

    if not (smtp_host and smtp_user and smtp_pass):
        print(f"\n[DEV MODE] SMTP not configured. Mocking email to {to_email}:")
        print("-" * 40)
        print(body)
        print("-" * 40)
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(smtp_host, int(smtp_port))
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        print(f"✅ Credentials emailed to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

# -----------------------------
# ENDPOINT
# -----------------------------
@router.post("/users")
def create_staff_user(
    user_data: CreateUserRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Creates a new user in Supabase Auth with a specific role.
    Sends credentials via email.
    Only accessible by ADMINs.
    """
    require_role(current_user, ["admin"])

    try:
        # FIX: We must set 'app_metadata' for roles, NOT 'user_metadata'.
        # user_metadata is editable by the user (unsafe for roles).
        # app_metadata is secure and only editable by the Service Role key.
        
        attributes = {
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": user_data.full_name,
                # Note: We can duplicate role here for UI display if needed, 
                # but auth checks must use app_metadata
            },
            "app_metadata": {
                "role": user_data.role,  # <--- THIS WAS THE FIX
                "force_password_change": user_data.force_password_change
            }
        }

        response = supabase_admin.auth.admin.create_user(attributes)
        
        background_tasks.add_task(
            send_credentials_email, 
            user_data.email, 
            user_data.password, 
            user_data.full_name
        )
        
        return {
            "message": "User created successfully. Credentials queued for email.", 
            "user_id": response.user.id
        }

    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg:
            raise HTTPException(status_code=400, detail="User with this email already exists.")
        
        raise HTTPException(status_code=400, detail=f"Failed to create user: {error_msg}")