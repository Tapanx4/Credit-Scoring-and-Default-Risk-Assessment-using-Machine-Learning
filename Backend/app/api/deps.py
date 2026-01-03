from typing import Generator
from app.db.session import SessionLocal

def get_db() -> Generator:
    """
    Dependency to provide a database session for a single request.
    Closes the session automatically when the request finishes.
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()