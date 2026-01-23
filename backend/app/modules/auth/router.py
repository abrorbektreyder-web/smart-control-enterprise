from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from app.core.db import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.modules.auth.models import User, UserRole
from app.modules.auth.schemas import UserCreate, Token, UserResponse, UserBase

# Admin Schema for Password Reset
from pydantic import BaseModel
class AdminPasswordReset(BaseModel):
    new_password: str

router = APIRouter(prefix="/auth", tags=["Auth"])

# --- PUBLIC ENDPOINTS ---

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 1. Check if user exists and password matches
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login yoki parol xato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. CHECK IF USER IS BLOCKED
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sizning profilingiz bloklangan. Administratorga murojaat qiling."
        )
    
    # Create Token
    access_token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ADMIN / OWNER ENDPOINTS ---

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # In a real app, protect this so only Admins can create new users
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        full_name=user.full_name,
        username=user.username,
        password_hash=get_password_hash(user.password),
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    # Returns list of all staff for the Owner to see
    return db.query(User).all()

@router.put("/users/{user_id}/status")
def toggle_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    # Block or Unblock a user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == UserRole.OWNER:
         raise HTTPException(status_code=400, detail="Cannot block the Owner")

    user.is_active = is_active
    db.commit()
    return {"message": f"User status updated to {'Active' if is_active else 'Blocked'}"}

@router.put("/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, reset_data: AdminPasswordReset, db: Session = Depends(get_db)):
    # Owner forces a new password for a user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
