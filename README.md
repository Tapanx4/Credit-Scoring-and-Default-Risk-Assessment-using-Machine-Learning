SmartLend: AI-Powered Credit Underwriting System

SmartLend is a bank-grade lending platform that automates credit decisions using a 2-stage Machine Learning pipeline (Neural Network + CatBoost) and an Economic Value (EV) engine.

🚀 Features

🧠 The Intelligence Layer

Hybrid Scoring: Stacks a Keras Neural Network with CatBoost for high-precision default prediction (PD).

Bias Correction: Uses Inverse Probability Weighting (IPW) to correct for reject-inference bias.

Economic Engine: Calculates Net Expected Value (EV) per loan based on risk-based pricing (APR) and amortization curves.

Stress Testing: Automatically "shadow tests" every application against a 20% LGD spike (recession scenario).

🖥️ The Applications

Applicant Portal: Multi-step wizard with real-time eligibility checks, document upload, and offer acceptance.

Underwriter Dashboard: Queue management, "X-Ray" view of risk drivers (SHAP), and manual override capabilities.

Admin Command Center: Real-time portfolio analytics (ROI, Volume, Vintage Analysis) and staff management.

🛡️ Architecture

Backend: FastAPI (Python), SQLAlchemy, Pydantic.

Frontend: React (Vite), TypeScript, Tailwind, Recharts.

Database: PostgreSQL (Supabase) with strict State Machine enforcement.

Auth: JWT-based Role-Based Access Control (RBAC).

🛠️ Quick Start

Prerequisites

Python 3.10+

Node.js 18+

Supabase Account

1. Backend Setup

cd backend
pip install poetry
poetry install
# Configure .env with your Supabase credentials
uvicorn app.main:app --reload


2. Frontend Setup

cd frontend
npm install
# Configure .env with your Supabase keys
npm start


3. ML Artifacts

Ensure the following models are in backend/artifacts/:

final_catboost_ipw.cbm

final_nn_model_ipw.keras

isotonic_ipw.pkl

nn_scaler_ipw.pkl

embedding_encoders_ipw.pkl

🧪 Testing

Submit an Application:

Login as an applicant.

Fill out the wizard.

Instant Result: Accepted (Green), Manual Review (Yellow), or Declined (Red).

Underwriter Override:

Login as underwriter@smartlend.com.

Navigate to the Dashboard.

Review a declined application.

Click "Override & Approve" to force funding.