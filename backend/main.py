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
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/')
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "Keechak")
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

# Endpoint to return both schools and colleges for frontend dropdown
@app.get("/institutes")
async def get_institutes():
    schools = await institute_db.schools.find({}, {"name": 1, "code": 1, "city": 1}).to_list(length=100)
    for s in schools:
        s["type"] = "school"
    colleges = await institute_db.colleges.find({}, {"name": 1, "code": 1, "city": 1}).to_list(length=100)
    for c in colleges:
        c["type"] = "college"
    # Return a single list with type field
    return [
        {"id": str(i["_id"]), "name": i.get("name", ""), "code": i.get("code", ""), "city": i.get("city", ""), "type": i["type"]}
        for i in (schools + colleges)
    ]

# --- Schools endpoint for frontend dropdown ---

# Use a separate Motor client for the 'institute' database
from motor.motor_asyncio import AsyncIOMotorClient
institute_client = AsyncIOMotorClient(MONGODB_URI)
institute_db = institute_client["institute"]

@app.get("/schools")
async def get_schools():
    schools = await institute_db.schools.find({}, {"name": 1, "code": 1, "city": 1}).to_list(length=100)
    return [{"id": str(s["_id"]), "name": s.get("name", ""), "code": s.get("code", ""), "city": s.get("city", "")} for s in schools]

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



# --- Normalized UserCreate: only school_id (ObjectId) ---
class UserCreate(BaseModel):
    name: NameT
    age: Annotated[int, Field(ge=3, le=120)]
    gender: GenderT = None
    phone: PhoneT
    email: EmailStr
    password: PasswordT
    school_id: str  # ObjectId as string

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




# --- Normalized UserOut: school info joined, badges joined ---
from typing import List, Dict, Any
class UserOut(BaseModel):
    id: str
    name: str
    age: int
    gender: Optional[str]
    phone: str
    email: EmailStr
    karma_points: int
    school: Dict[str, Any]  # joined school info
    learning_streak: int
    login_dates: list[str]
    role: str = "student"
    badges: List[Dict[str, Any]] = []
    leaderboard_rank: int = 0

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --------------------------
# MongoDB helper
# --------------------------

# --- Extended user_helper ---
import asyncio
async def user_helper(user_doc, db=None) -> dict:
    out = {
        "id": str(user_doc["_id"]),
        "name": user_doc["name"],
        "age": user_doc["age"],
        "gender": user_doc.get("gender"),
        "phone": user_doc["phone"],
        "email": user_doc["email"],
        "karma_points": int(user_doc.get("karma_points", 0)),
        "school": {},
        "learning_streak": int(user_doc.get("learning_streak", 0)),
        "login_dates": [str(d) for d in user_doc.get("login_dates", [])],
        "role": user_doc.get("role", "student"),
        "badges": [],
        "leaderboard_rank": 0,
    }
    if db is not None:
        # School/College info join from INSTITUTE DB
        from motor.motor_asyncio import AsyncIOMotorClient
        MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/')
        institute_client = AsyncIOMotorClient(MONGODB_URI)
        institute_db = institute_client["institute"]
        school = await institute_db.schools.find_one({"_id": ObjectId(user_doc["school_id"])}) if user_doc.get("school_id") else None
        if school:
            out["school"] = {
                "id": str(school["_id"]),
                "name": school.get("name", ""),
                "code": school.get("code", ""),
                "city": school.get("city", ""),
                "type": "school",
            }
        else:
            college = await institute_db.colleges.find_one({"_id": ObjectId(user_doc["school_id"])}) if user_doc.get("school_id") else None
            if college:
                out["school"] = {
                    "id": str(college["_id"]),
                    "name": college.get("name", ""),
                    "code": college.get("code", ""),
                    "city": college.get("city", ""),
                    "type": "college",
                }
        # Badges join
        user_badges = await db.user_badges.find({"user_id": user_doc["_id"]}).to_list(length=100)
        badge_ids = [ub["badge_id"] for ub in user_badges]
        badges = []
        if badge_ids:
            badges = await db.badges.find({"_id": {"$in": badge_ids}}).to_list(length=100)
        out["badges"] = [{"name": b.get("name"), "image_url": b.get("image_url"), "unlocked_at": str(next((ub["unlocked_at"] for ub in user_badges if ub["badge_id"]==b["_id"]), ""))} for b in badges]
        # Leaderboard rank (by karma_points, descending)
        rank = 1
        cursor = db.users.find({}, {"_id": 1, "karma_points": 1}).sort("karma_points", -1)
        async for u in cursor:
            if u["_id"] == user_doc["_id"]:
                break
            rank += 1
        out["leaderboard_rank"] = rank
    return out

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
    return await user_helper(user_doc, app.db)

# --------------------------
# Routes
# --------------------------

# --- Extended signup to include school/location and streak fields ---
@app.post("/signup")
async def signup(user: UserCreate):
    # Validate school or college exists in the INSTITUTE DB
    school = await institute_db.schools.find_one({"_id": ObjectId(user.school_id)})
    college = None
    if not school:
        college = await institute_db.colleges.find_one({"_id": ObjectId(user.school_id)})
    if not (school or college):
        raise HTTPException(status_code=400, detail="Invalid school_id")
    hashed_pwd = hash_password(user.password)
    user_doc = {
        "name": user.name,
        "age": user.age,
        "gender": user.gender,
        "phone": user.phone,
        "email": user.email.lower(),
        "password": hashed_pwd,
        "karma_points": 50,  # Signup bonus
        "created_at": datetime.utcnow(),
        "school_id": ObjectId(user.school_id),
        "learning_streak": 0,
        "login_dates": [],
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
    # Badge unlock check for signup (e.g., signup bonus karma)
    new_badges = await check_and_award_badges(created, app.db)
    user_out = await user_helper(created, app.db)
    resp = {"user": user_out}
    if new_badges:
        resp["new_badges"] = new_badges
    return resp


# --- Extended login to update login_dates and learning_streak ---

# --- Badge unlock logic helper ---
async def check_and_award_badges(user_doc, db):
    """
    Checks badge conditions and awards new badges if unlocked. Returns list of new badge names.
    """
    new_badges = []
    user_id = user_doc["_id"]
    karma = int(user_doc.get("karma_points", 0))
    streak = int(user_doc.get("learning_streak", 0))
    # Get already unlocked badge ids
    user_badges = await db.user_badges.find({"user_id": user_id}).to_list(length=100)
    unlocked_badge_ids = set(ub["badge_id"] for ub in user_badges)
    # Badge conditions (from readme.txt)
    badge_conditions = [
        # Streak badges
        ("Eco Newbie", lambda u: streak >= 1),
        ("Eco Enthusiast", lambda u: streak >= 3),
        ("Eco Warrior", lambda u: streak >= 7),
        ("Eco Champion", lambda u: streak >= 14),
        ("Eco Legend", lambda u: streak >= 30),
        # Karma badges
        ("Green Sprout", lambda u: karma >= 100),
        ("Tree Planter", lambda u: karma >= 250),
        ("Water Saver", lambda u: karma >= 500),
        ("Plastic Buster", lambda u: karma >= 1000),
        ("Earth Guardian", lambda u: karma >= 2000),
    ]
    # Get all badge docs
    all_badges = await db.badges.find({"name": {"$in": [b[0] for b in badge_conditions]}}).to_list(length=20)
    name_to_badge = {b["name"]: b for b in all_badges}
    now = datetime.utcnow()
    for badge_name, cond in badge_conditions:
        badge = name_to_badge.get(badge_name)
        if badge and badge["_id"] not in unlocked_badge_ids and cond(user_doc):
            await db.user_badges.insert_one({
                "user_id": user_id,
                "badge_id": badge["_id"],
                "unlocked_at": now
            })
            new_badges.append(badge_name)
    return new_badges

@app.post("/login")
async def login(payload: LoginRequest):
    user_doc = await app.db.users.find_one({"email": payload.email.lower()})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # --- Learning streak logic ---
    today = datetime.utcnow().date()
    login_dates = [datetime.strptime(d, "%Y-%m-%d").date() if isinstance(d, str) else d.date() for d in user_doc.get("login_dates", [])]
    daily_bonus = 0
    if today not in login_dates:
        login_dates.append(today)
        login_dates = sorted(set(login_dates))
        daily_bonus = 5
    # Calculate streak: consecutive days up to today
    streak = 0
    for i in range(len(login_dates)-1, -1, -1):
        if (today - login_dates[i]).days == streak:
            streak += 1
        else:
            break
    # Update user in DB
    update_fields = {
        "login_dates": [d.strftime("%Y-%m-%d") for d in login_dates],
        "learning_streak": streak
    }
    if daily_bonus:
        update_fields["karma_points"] = int(user_doc.get("karma_points", 0)) + daily_bonus
    await app.db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": update_fields}
    )
    # Refresh user_doc
    user_doc = await app.db.users.find_one({"_id": user_doc["_id"]})
    # --- Badge unlock check ---
    new_badges = await check_and_award_badges(user_doc, app.db)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(data={"user_id": str(user_doc["_id"]), "email": user_doc["email"]}, expires_delta=access_token_expires)
    resp = {"access_token": token, "token_type": "bearer", "expires_in": int(access_token_expires.total_seconds())}
    if new_badges:
        resp["new_badges"] = new_badges
    return resp

@app.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
