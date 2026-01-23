from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ShiftBase(BaseModel):
    start_cash: float

class ShiftCreate(ShiftBase):
    pass

class ShiftClose(BaseModel):
    end_cash: float
    shortage_amount: float = 0 # Kamomad (If items are missing from Yellow Basket)

class ShiftResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    start_cash: float
    end_cash: Optional[float]
    status: str

    class Config:
        from_attributes = True
