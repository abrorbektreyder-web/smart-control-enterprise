from sqlalchemy import Column, Integer, Numeric, DateTime, String, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.db import Base

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    start_cash = Column(Numeric(12, 2), default=0)  # Money in drawer at start
    end_cash = Column(Numeric(12, 2), nullable=True) # Actual money counted at close
    
    status = Column(String, default="OPEN")  # OPEN / CLOSED
    
    # Relationship
    user = relationship("app.modules.auth.models.User")
