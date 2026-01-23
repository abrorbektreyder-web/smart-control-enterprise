import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from app.core.db import engine, Base
from app.modules.auth.models import User
from sqlalchemy import text

def verify_auth_module():
    print("Verifying Auth Module Setup...")
    
    # Check DB Connection again with new password
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        print("✅ Database connection successful with new credentials!")
    except Exception as e:
        print(f"❌ Database connection failed: {repr(e)}")
        return

    # Create Tables
    try:
        print("Attempting to create tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully via SQLAlchemy!")
    except Exception as e:
        print(f"❌ Failed to create tables: {repr(e)}")
        return

    print("Auth Module verification complete. Ready for API testing.")

if __name__ == "__main__":
    verify_auth_module()
