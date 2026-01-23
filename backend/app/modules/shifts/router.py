from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.db import get_db
from app.core.notifications import send_telegram_alert
from app.modules.shifts.models import Shift
from app.modules.shifts.schemas import ShiftCreate, ShiftClose, ShiftResponse
from app.modules.debts.models import Debt, DebtStatus

router = APIRouter(prefix="/shifts", tags=["Shifts"])

@router.post("/open", response_model=ShiftResponse)
def open_shift(shift_data: ShiftCreate, user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if active_shift:
        raise HTTPException(status_code=400, detail="You already have an open shift")
    
    new_shift = Shift(user_id=user_id, start_cash=shift_data.start_cash, status="OPEN")
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    return new_shift

@router.post("/close", response_model=ShiftResponse)
def close_shift(close_data: ShiftClose, user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if not active_shift:
        raise HTTPException(status_code=400, detail="No open shift found")
    
    # 1. Update Shift
    active_shift.end_cash = close_data.end_cash
    active_shift.end_time = datetime.now()
    active_shift.status = "CLOSED"
    
    # 2. HANDLE SHORTAGE (Kamomad)
    if close_data.shortage_amount > 0:
        # Create Debt automatically assigned to the Cashier
        new_debt = Debt(
            customer_name=f"KASSIR KAMOMADI (Shift {active_shift.id})",
            original_amount=close_data.shortage_amount,
            remaining_amount=close_data.shortage_amount,
            status=DebtStatus.OPEN
        )
        db.add(new_debt)
        
        # Send Alert
        send_telegram_alert(f"🚨 KAMOMAD! Shift Closed. Cashier: {user_id}. Shortage: {close_data.shortage_amount} sum.")
    else:
        send_telegram_alert(f"✅ Shift Closed Successfully. Cashier: {user_id}. No Shortage.")

    db.commit()
    db.refresh(active_shift)
    return active_shift

@router.get("/status/{user_id}", response_model=ShiftResponse)
def get_shift_status(user_id: int, db: Session = Depends(get_db)):
    active_shift = db.query(Shift).filter(Shift.user_id == user_id, Shift.status == "OPEN").first()
    if not active_shift:
        raise HTTPException(status_code=404, detail="No active shift")
    return active_shift
