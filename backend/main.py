import os
import re
from datetime import datetime, timedelta, time
import pytz
from typing import Optional, Annotated, List, Dict, Any
from contextlib import asynccontextmanager

import uvicorn
import pymongo.errors
from bson import ObjectId
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field, field_validator

from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import io
import csv
from fastapi.responses import StreamingResponse


# --------------------------
# Configuration
# --------------------------
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/')
MONGO_DB_NAME_AUTH = os.getenv("MONGO_DB_NAME_AUTH", "Keechak")
MONGO_DB_NAME_CONTENT = os.getenv("MONGO_DB_NAME_CONTENT", "prakriti_content")
MONGO_DB_NAME_INSTITUTE = os.getenv("MONGO_DB_NAME_INSTITUTE", "institute")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# --------------------------
# Security & Helper Utils
# --------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def convert_object_ids(obj):
    if isinstance(obj, list):
        return [convert_object_ids(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: convert_object_ids(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(*, data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from e

# --------------------------
# Pydantic Models
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
    school_id: str

    @field_validator("name")
    @classmethod
    def name_must_have_letter(cls, v: str) -> str:
        v = v.strip()
        if not any(ch.isalpha() for ch in v):
            raise ValueError("name must contain at least one letter")
        return v


class UserOut(BaseModel):
    id: str
    name: str
    age: int
    gender: Optional[str]
    phone: str
    email: EmailStr
    karma_points: int
    school: Dict[str, Any]
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

class LearningCompleteRequest(BaseModel):
    quest_id: str
    proof_url: Optional[str] = None

class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: list[int]

# --------------------------
# Database Lifespan Manager
# --------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup
    app.mongodb_client = AsyncIOMotorClient(MONGODB_URI)
    app.db_auth = app.mongodb_client[MONGO_DB_NAME_AUTH]
    app.db_content = app.mongodb_client[MONGO_DB_NAME_CONTENT]
    app.db_institute = app.mongodb_client[MONGO_DB_NAME_INSTITUTE]
    print("Database connection established.")
    yield
    # On shutdown
    app.mongodb_client.close()
    print("Database connection closed.")

# --------------------------
# FastAPI App Initialization
# --------------------------
app = FastAPI(title="EcoLearn API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.isdir("public"):
    app.mount("/static", StaticFiles(directory="public", html=True), name="static")


# --------------------------
# Database Helper Functions
# --------------------------
async def user_helper(user_doc, db_auth, db_institute) -> dict:
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
        "login_dates": user_doc.get("login_dates", []),
        "role": user_doc.get("role", "student"),
        "badges": [],
        "leaderboard_rank": 0,
    }

    school_id = user_doc.get("school_id")
    if school_id:
        school = await db_institute.schools.find_one({"_id": ObjectId(school_id)})
        if school:
            out["school"] = {"id": str(school["_id"]), "name": school.get("name", ""), "code": school.get("code", ""), "city": school.get("city", ""), "type": "school"}
        else:
            college = await db_institute.colleges.find_one({"_id": ObjectId(school_id)})
            if college:
                out["school"] = {"id": str(college["_id"]), "name": college.get("name", ""), "code": college.get("code", ""), "city": college.get("city", ""), "type": "college"}

    user_badges = await db_auth.user_badges.find({"user_id": user_doc["_id"]}).to_list(length=100)
    badge_ids = [ub["badge_id"] for ub in user_badges]
    if badge_ids:
        badges = await db_auth.badges.find({"_id": {"$in": badge_ids}}).to_list(length=100)
        out["badges"] = [{"name": b.get("name"), "image_url": b.get("image_url"), "unlocked_at": str(next((ub["unlocked_at"] for ub in user_badges if ub["badge_id"] == b["_id"]), ""))} for b in badges]

    rank = await db_auth.users.count_documents({"karma_points": {"$gt": out["karma_points"]}}) + 1
    out["leaderboard_rank"] = rank
    
    return out

async def check_and_award_badges(user_doc, db_auth):
    new_badges = []
    user_id = user_doc["_id"]
    karma = int(user_doc.get("karma_points", 0))
    streak = int(user_doc.get("learning_streak", 0))
    user_badges = await db_auth.user_badges.find({"user_id": user_id}).to_list(length=100)
    unlocked_badge_ids = {ub["badge_id"] for ub in user_badges}
    
    badge_conditions = [
        ("Eco Newbie", lambda: streak >= 1), ("Eco Enthusiast", lambda: streak >= 3),
        ("Eco Warrior", lambda: streak >= 7), ("Eco Champion", lambda: streak >= 14),
        ("Eco Legend", lambda: streak >= 30), ("Green Sprout", lambda: karma >= 100),
        ("Tree Planter", lambda: karma >= 250), ("Water Saver", lambda: karma >= 500),
        ("Plastic Buster", lambda: karma >= 1000), ("Earth Guardian", lambda: karma >= 2000),
    ]
    
    all_badges = await db_auth.badges.find({"name": {"$in": [b[0] for b in badge_conditions]}}).to_list(length=20)
    name_to_badge = {b["name"]: b for b in all_badges}
    now = datetime.utcnow()
    
    for badge_name, cond in badge_conditions:
        badge = name_to_badge.get(badge_name)
        if badge and badge["_id"] not in unlocked_badge_ids and cond():
            await db_auth.user_badges.insert_one({"user_id": user_id, "badge_id": badge["_id"], "unlocked_at": now})
            new_badges.append(badge_name)
    return new_badges

# --------------------------
# Auth Dependency
# --------------------------
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token payload invalid")
    try:
        user_doc = await app.db_auth.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id in token")
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return await user_helper(user_doc, app.db_auth, app.db_institute)

# --------------------------
# Routes
# --------------------------
@app.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate):
    school = await app.db_institute.schools.find_one({"_id": ObjectId(user.school_id)})
    if not school:
        college = await app.db_institute.colleges.find_one({"_id": ObjectId(user.school_id)})
        if not college:
            raise HTTPException(status_code=400, detail="Invalid school_id")

    user_doc = user.model_dump()
    user_doc["password"] = hash_password(user.password)
    user_doc["email"] = user.email.lower()
    user_doc["karma_points"] = 50
    user_doc["created_at"] = datetime.utcnow()
    user_doc["school_id"] = ObjectId(user.school_id)
    user_doc["learning_streak"] = 0
    user_doc["login_dates"] = []
    
    try:
        result = await app.db_auth.users.insert_one(user_doc)
    except pymongo.errors.DuplicateKeyError as e:
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        if "phone" in str(e):
            raise HTTPException(status_code=400, detail="Phone already registered")
        raise HTTPException(status_code=400, detail="Duplicate value error")

    created = await app.db_auth.users.find_one({"_id": result.inserted_id})
    new_badges = await check_and_award_badges(created, app.db_auth)
    user_out = await user_helper(created, app.db_auth, app.db_institute)
    return {"user": user_out, "new_badges": new_badges}

@app.post("/login")
async def login(payload: LoginRequest):
    user_doc = await app.db_auth.users.find_one({"email": payload.email.lower()})
    if not user_doc or not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    # --- CORRECTED LEARNING STREAK LOGIC ---
    today = datetime.utcnow().date()
    login_dates_from_db = user_doc.get("login_dates", [])
    
    # Robustly parse dates, whether they are strings or datetime objects
    login_dates = set()
    for d in login_dates_from_db:
        if isinstance(d, str):
            login_dates.add(datetime.fromisoformat(d).date())
        elif isinstance(d, datetime):
            login_dates.add(d.date())

    daily_bonus = 5 if today not in login_dates else 0
    login_dates.add(today)

    streak = 0
    sorted_dates = sorted(list(login_dates), reverse=True)
    for i, d in enumerate(sorted_dates):
        if (today - d).days == i:
            streak += 1
        else:
            break
    
    update_fields = {
        # Always store dates in a consistent ISO string format
        "login_dates": [d.isoformat() for d in sorted(login_dates)],
        "learning_streak": streak
    }
    
    # Use find_one_and_update to get the latest document after incrementing karma
    updated_user_doc = await app.db_auth.users.find_one_and_update(
        {"_id": user_doc["_id"]},
        {
            "$set": update_fields,
            "$inc": {"karma_points": daily_bonus} if daily_bonus > 0 else {}
        },
        return_document=pymongo.ReturnDocument.AFTER
    )
    # -------------------------------------------
    
    new_badges = await check_and_award_badges(updated_user_doc, app.db_auth)
    
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(data={"user_id": str(updated_user_doc["_id"])}, expires_delta=expires)
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "expires_in": int(expires.total_seconds()),
        "new_badges": new_badges
    }

@app.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/institutes")
async def get_institutes():
    schools = await app.db_institute.schools.find({}, {"name": 1, "code": 1, "city": 1}).to_list(length=None)
    colleges = await app.db_institute.colleges.find({}, {"name": 1, "code": 1, "city": 1}).to_list(length=None)
    
    result = [
        {"id": str(s["_id"]), "name": s.get("name", ""), "code": s.get("code", ""), "city": s.get("city", ""), "type": "school"} for s in schools
    ]
    result.extend([
        {"id": str(c["_id"]), "name": c.get("name", ""), "code": c.get("code", ""), "city": c.get("city", ""), "type": "college"} for c in colleges
    ])
    return result


# --- Imports for Report Downloading (add these to the top of your file) ---


# --- Pydantic Model for Quest Creation (add this with your other models) ---
class QuestCreate(BaseModel):
    title: str
    description: str

# --- Endpoints for Teacher Portal (add these with your other endpoints) ---

@app.get("/students")
async def get_students():
    """Fetches all users from the database for the Students page."""
    students_list = await app.db_auth.users.find({}).to_list(length=None)
    
    response = []
    for student in students_list:
        clean_student = {
            "id": str(student['_id']),
            "name": student.get("name"),
            "karma_points": student.get("karma_points", 0),
            "badges": student.get("badges", [])
        }
        response.append(clean_student)
        
    return response

@app.get("/leaderboard")
async def get_leaderboard():
    """Fetches the top 10 users sorted by karma points."""
    leaderboard_users = await app.db_auth.users.find({}, {"name": 1, "karma_points": 1}) \
                                             .sort("karma_points", -1) \
                                             .limit(10) \
                                             .to_list(length=10)
    
    response = [
        {
            "id": str(user["_id"]),
            "name": user.get("name", "Unnamed User"),
            "karma": user.get("karma_points", 0)
        }
        for user in leaderboard_users
    ]
    return response

@app.get("/quests")
async def get_all_quests():
    """Fetches all created quests from the database."""
    quests_collection = app.db_content['quests']
    quests = await quests_collection.find({}).to_list(length=100)
    return quests

@app.post("/quests")
async def create_quest(quest: QuestCreate):
    """Creates a new quest and saves it to the database."""
    quests_collection = app.db_content['quests']
    new_quest_data = quest.model_dump()
    result = await quests_collection.insert_one(new_quest_data)
    created_quest = await quests_collection.find_one({"_id": result.inserted_id})
    return created_quest

@app.delete("/quests/{quest_id}")
async def delete_quest(quest_id: str):
    """Deletes a quest from the database by its ID."""
    quests_collection = app.db_content['quests']
    delete_result = await quests_collection.delete_one({"_id": ObjectId(quest_id)})
    if delete_result.deleted_count == 1:
        return {"status": "success", "message": "Quest deleted"}
    raise HTTPException(status_code=404, detail="Quest not found")

@app.get("/reports/students")
async def download_student_report():
    """Generates and returns a CSV file of all students."""
    students = await app.db_auth.users.find({}).to_list(length=None)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["ID", "Name", "Email", "Karma Points"]) # Header
    
    for student in students:
        writer.writerow([
            str(student["_id"]),
            student.get("name"),
            student.get("email"),
            student.get("karma_points", 0)
        ])
    
    output.seek(0)
    headers = {"Content-Disposition": "attachment; filename=student_report.csv"}
    return StreamingResponse(output, headers=headers, media_type="text/csv")

@app.get("/learning/content")
async def get_learning_content(
    current_user: dict = Depends(get_current_user),
    week_id: str = Query(None),
    day_id: int = Query(None)
):
    now_utc = datetime.utcnow()

    # Determine week_id for context
    if not week_id:
        week = await app.db_content.weeks.find_one({
            "start_date": {"$lte": now_utc},
            "end_date": {"$gte": now_utc}
        })
        if not week:
            raise HTTPException(status_code=404, detail="No active week found for today")
        week_id = str(week["_id"])
    
    if not day_id:
        # ISO weekday: Monday=1 ... Sunday=7
        day_id = datetime.now(pytz.timezone("Asia/Kolkata")).isoweekday()

    # Fetch only today's quizzes
    quizzes = await app.db_content.quizzes.find({"day_id": day_id}).to_list(length=None)

    if not quizzes:
        raise HTTPException(status_code=404, detail="No learning content for today")

    # ObjectId → str converter
    def convert_object_ids(obj):
        if isinstance(obj, list):
            return [convert_object_ids(x) for x in obj]
        elif isinstance(obj, dict):
            return {k: convert_object_ids(v) for k, v in obj.items()}
        elif isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

    quiz_list = []
    for quiz in quizzes:
        quiz_obj = {
            "id": str(quiz["_id"]),
            "title": quiz.get("title", "Untitled Quiz"),
            "questions": []
        }
        for q in quiz.get("questions", []):
            quiz_obj["questions"].append({
                "question": q.get("question"),
                "options": q.get("options", [])
            })
        quiz_list.append(convert_object_ids(quiz_obj))

    return {
        "week_id": week_id,
        "day_id": day_id,
        "quizzes": quiz_list
    }


@app.post("/learning/complete")
async def complete_learning_content(
    payload: LearningCompleteRequest,
    current_user: dict = Depends(get_current_user)
):
    quest = await app.db_content.sections.find_one({"_id": ObjectId(payload.quest_id)}) or \
            await app.db_content.quizzes.find_one({"_id": ObjectId(payload.quest_id)})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if await app.db_auth.user_quests.find_one({"user_id": ObjectId(current_user["id"]), "quest_id": ObjectId(payload.quest_id)}):
        return {"success": True, "message": "Already completed"}

    await app.db_auth.user_quests.insert_one({
        "user_id": ObjectId(current_user["id"]),
        "quest_id": ObjectId(payload.quest_id),
        "completed_at": datetime.utcnow(),
        "proof_url": payload.proof_url
    })
    
    points = int(quest.get("points", 10))
    updated_user = await app.db_auth.users.find_one_and_update(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"karma_points": points}},
        return_document=pymongo.ReturnDocument.AFTER
    )
    
    new_badges = await check_and_award_badges(updated_user, app.db_auth)
    return {"success": True, "karma_earned": points, "new_badges": new_badges}

@app.post("/learning/quiz/submit")
async def submit_quiz(
    payload: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user)
):
    quiz = await app.db_content.quizzes.find_one({"_id": ObjectId(payload.quiz_id)})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if await app.db_auth.user_quests.find_one({"user_id": ObjectId(current_user["id"]), "quest_id": ObjectId(payload.quiz_id)}):
        raise HTTPException(status_code=400, detail="Quiz already completed")

    questions = quiz.get("questions", [])
    if len(payload.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers does not match number of questions")

    correct = 0
    results = []
    for idx, (q, ans) in enumerate(zip(questions, payload.answers)):
        is_correct = (ans == q.get("answer"))
        results.append({"question": q.get("question"), "selected": ans, "correct": q.get("answer"), "is_correct": is_correct})
        if is_correct:
            correct += 1
            
    await app.db_auth.quiz_history.insert_one({
        "user_id": ObjectId(current_user["id"]),
        "quiz_id": ObjectId(payload.quiz_id),
        "answers": payload.answers,
        "results": results,
        "marks": correct,
        "total": len(questions),
        "submitted_at": datetime.utcnow()
    })

    karma_earned = correct * 10
    if karma_earned > 0:
        await app.db_auth.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$inc": {"karma_points": karma_earned}}
        )
        
    await app.db_auth.user_quests.insert_one({
        "user_id": ObjectId(current_user["id"]),
        "quest_id": ObjectId(payload.quiz_id),
        "completed_at": datetime.utcnow()
    })
    
    return {"marks": correct, "total": len(questions), "results": results, "karma_earned": karma_earned}

# --------------------------
# Miscellaneous Routes
# --------------------------
@app.get("/db-status")
async def db_status():
    try:
        await app.mongodb_client.admin.command('ping')
        return {"status": "ok", "message": "Database connection is healthy."}
    except Exception as e:
        return JSONResponse(content={"status": "error", "detail": str(e)}, status_code=500)

@app.get("/reports/quests")
def get_quests_report():
    file_path = "quests_report.txt"
    with open(file_path, "w") as f:
        f.write("Quests Report\nQuest ID, Status\n1, Active\n2, Completed\n")
    return FileResponse(path=file_path, filename="quests_report.txt", media_type="text/plain")

# --------------------------
# Main Entry Point
# --------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
