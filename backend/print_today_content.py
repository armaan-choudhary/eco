from pymongo import MongoClient
from datetime import datetime

# Update with your actual MongoDB URI and database name
MONGODB_URI = "mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/"
DB_NAME = "prakriti_content"

# Set this to today's day number (1=Monday, 7=Sunday)
today = datetime.utcnow().weekday() + 1

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

print(f"Today's day_id: {today}")

print("\n--- Lessons for today in 'sections' ---")
for doc in db.sections.find({"day_id": today, "type": "lesson"}):
    print(doc)

print("\n--- Quizzes for today in 'quizzes' ---")
for doc in db.quizzes.find({"day_id": today}):
    print(doc)
