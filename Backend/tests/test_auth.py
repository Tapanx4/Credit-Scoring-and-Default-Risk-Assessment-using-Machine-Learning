import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Load Config
# Ensure we are pointing to the backend/.env file
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, "../.env")
load_dotenv(env_path)

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_ANON_KEY")

if not URL or not KEY:
    print(f"❌ Error: Could not load SUPABASE_URL or SUPABASE_KEY from {env_path}")
    print("   Make sure your .env file exists and is populated.")
    sys.exit(1)

supabase: Client = create_client(URL, KEY)

def get_token(email, password):
    print(f"\n🔐 Attempting login for: {email}...")
    try:
        # Authenticate with Supabase
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        token = res.session.access_token
        
        print("\n✅ SUCCESS! Here is your Bearer Token:")
        print("-" * 60)
        print(token)
        print("-" * 60)
        print("\n📋 Usage in Postman/Curl:")
        print(f"Authorization: Bearer {token[:10]}...")
        
    except Exception as e:
        print(f"\n❌ Login Failed: {e}")
        print("   - Did you create this user in Supabase Dashboard?")
        print("   - Is the password correct?")

if __name__ == "__main__":
    # You can change these defaults or use input()
    default_email = "admin@smartlend.com"
    
    print("--- 🔑 SmartLend Token Generator ---")
    email = input(f"Enter Email [default: {default_email}]: ").strip() or default_email
    password = input("Enter Password: ").strip()
    
    get_token(email, password)