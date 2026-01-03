from sqlalchemy.orm import declarative_base

# The declarative base class for all SQLAlchemy models
# All models (Application, Decision, AuditLog) will inherit from this.
Base = declarative_base()