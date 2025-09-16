
# main.py
import os
from datetime import datetime, timedelta
from typing import Optional, Annotated
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field, field_validator
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId
from pymongo import ReturnDocument
import pymongo.errors
import re
from pymongo import MongoClient

# --------------------------
# Configuration (env vars)
# --------------------------
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Brave:Ug1mbn5T8ALfHLgS@auth.fzjv1an.mongodb.net/')
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "Auth")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

client = MongoClient(MONGODB_URI)
db = client[MONGO_DB_NAME]

# --------------------------
# Security utils
# --------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# --------------------------
# Lifespan (replaces startup/shutdown)
# --------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URI)
    app.db = app.mongodb_client[MONGO_DB_NAME]
    try:
        # ensure unique indexes (best-effort)
        await app.db.users.create_index("email", unique=True)
        await app.db.users.create_index("phone", unique=True)
    except Exception:
        pass
    yield
    # shutdown
    app.mongodb_client.close()

# --------------------------
# App (attach lifespan)
# --------------------------
from fastapi.responses import JSONResponse
app = FastAPI(title="EcoLearn Auth (FastAPI + MongoDB + StaticFiles)", lifespan=lifespan)

# CORS - permissive for dev. Lock down in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files at /static if public folder exists
if os.path.isdir("public"):
    app.mount("/static", StaticFiles(directory="public", html=True), name="static")

# --------------------------
# DB Connection Status Route
# --------------------------
@app.get("/db-status")
async def db_status():
    try:
        # Try to list collections as a simple connectivity check
        collections = await app.db.list_collection_names()
        return JSONResponse(content={"status": "ok", "collections": collections})
    except Exception as e:
        return JSONResponse(content={"status": "error", "detail": str(e)}, status_code=500)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from e

# --------------------------
# Pydantic (Pydantic v2 style)
# --------------------------
NameT = Annotated[str, Field(min_length=1, max_length=100)]
GenderT = Annotated[Optional[str], Field(max_length=20)]
PhoneT = Annotated[str, Field(pattern=r"^\+?[0-9]{7,15}$")]
PasswordT = Annotated[str, Field(min_length=8)]

class UserCreate(BaseModel):
    name: NameT
    age: Annotated[int, Field(ge=3, le=120)]
    gender: GenderT = None
    phone: PhoneT
    email: EmailStr
    password: PasswordT

    # Pydantic v2 field validators
    @field_validator("name")
    @classmethod
    def name_must_have_letter(cls, v: str) -> str:
        v = v.strip()
        if not any(ch.isalpha() for ch in v):
            raise ValueError("name must contain at least one letter")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        if not re.match(r"^\+?[0-9]{7,15}$", v):
            raise ValueError("phone must be digits, optional +, length 7-15")
        return v

    @field_validator("password")
    @classmethod
    def password_len(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v

class UserOut(BaseModel):
    id: str
    name: str
    age: int
    gender: Optional[str]
    phone: str
    email: EmailStr
    karma_points: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class KarmaUpdate(BaseModel):
    delta: int = Field(..., ge=-10000, le=10000)

# --------------------------
# MongoDB helper
# --------------------------
def user_helper(user_doc) -> dict:
    return {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "age": user_doc["age"],
        "gender": user_doc.get("gender"),
        "phone": user_doc["phone"],
        "email": user_doc["email"],
        "karma_points": int(user_doc.get("karma_points", 0)),
    }

# --------------------------
# Lifespan (replaces startup/shutdown)
# --------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URI)
    app.db = app.mongodb_client[MONGO_DB_NAME]
    try:
        # ensure unique indexes (best-effort)
        await app.db.users.create_index("email", unique=True)
        await app.db.users.create_index("phone", unique=True)
    except Exception:
        pass
        # Try to list collections as a simple connectivity check
        collections = await app.db.list_collection_names()
        return JSONResponse(content={"status": "ok", "collections": collections})
    except Exception as e:
        return JSONResponse(content={"status": "error", "detail": str(e)}, status_code=500)

# CORS - permissive for dev. Lock down in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files if public folder exists
if os.path.isdir("public"):
    app.mount("/static", StaticFiles(directory="public", html=True), name="static")

# --------------------------
# Auth dependency
# --------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token payload invalid")
    try:
        user_doc = await app.db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id in token")
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user_doc)

# --------------------------
# Routes
# --------------------------
@app.post("/signup", response_model=UserOut, status_code=201)
async def signup(user: UserCreate):
    hashed_pwd = hash_password(user.password)
    user_doc = {
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "phone": user.phone,
        "email": user.email.lower(),
        "password": hashed_pwd,
        "karma_points": 0,
        "created_at": datetime.utcnow(),
    }
    try:
        result = await app.db.users.insert_one(user_doc)
    except pymongo.errors.DuplicateKeyError:
        existing_email = await app.db.users.find_one({"email": user.email.lower()})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        existing_phone = await app.db.users.find_one({"phone": user.phone})
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone already registered")
        raise HTTPException(status_code=400, detail="Duplicate value")
    created = await app.db.users.find_one({"_id": result.inserted_id})
    return user_helper(created)

@app.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user_doc = await app.db.users.find_one({"email": payload.email.lower()})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(data={"user_id": str(user_doc["_id"]), "email": user_doc["email"]}, expires_delta=access_token_expires)
    return TokenResponse(access_token=token, expires_in=int(access_token_expires.total_seconds()))

@app.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.post("/karma", response_model=UserOut)
async def update_karma(update: KarmaUpdate, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    new = await app.db.users.find_one_and_update(
        {"_id": user_id},
        {"$inc": {"karma_points": int(update.delta)}},
        return_document=ReturnDocument.AFTER,
    )
    if not new:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(new)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
