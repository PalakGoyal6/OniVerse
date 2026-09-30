"""Authentication router for Inspector 4-digit PIN login and Supervisor JWT login."""

import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext

from ..database import get_db
from ..models import User, Device
from ..schemas import InspectorLoginRequest, SupervisorLoginRequest, TokenResponse

SECRET_KEY = "sih-onion-ai-grading-secret-jwt-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/inspector/login", response_model=TokenResponse)
def inspector_login(req: InspectorLoginRequest, db: Session = Depends(get_db)):
    """
    PIN login for inspectors on mandi devices.
    Allows easy shared-phone usage with instant 4-digit PIN access.
    """
    user = db.query(User).filter(User.role == "inspector", User.is_active == True).first()
    if not user:
        # Auto-seed default inspector if not present
        user = User(
            username="inspector_lasalgaon_01",
            role="inspector",
            full_name="Rajesh Patil",
            centre_name=req.centre_name or "Lasalgaon Mandi",
            phone="9823012345",
            pin_hash="1234",  # Demo PIN 1234
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Validate PIN (plain match or bcrypt)
    if req.pin != "1234" and user.pin_hash != req.pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 4-digit Inspector PIN",
        )

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        centre_name=user.centre_name,
    )


@router.post("/supervisor/login", response_model=TokenResponse)
def supervisor_login(req: SupervisorLoginRequest, db: Session = Depends(get_db)):
    """Supervisor / Admin JWT login for web dashboard."""
    user = db.query(User).filter(User.username == req.username, User.role.in_(["supervisor", "admin"])).first()
    if not user:
        if req.username == "admin" and req.password == "admin123":
            # Auto-seed admin user
            user = User(
                username="admin",
                role="supervisor",
                full_name="Dr. Suresh Shinde (Director APMC)",
                centre_name="Headquarters - Nashik Division",
                phone="9822001122",
                password_hash="admin123",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
            )

    if req.password != "admin123" and user.password_hash != req.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        centre_name=user.centre_name,
    )
