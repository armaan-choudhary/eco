import os
from datetime import datetime, timedelta
from pymongo import MongoClient

import sys
import json

# MongoDB connection setup
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/')
DB_NAME = os.getenv('MONGO_DB_NAME_CONTENT', 'prakriti_content')

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
weeks_col = db['weeks']
sections_col = db['sections']
quizzes_col = db['quizzes']

def get_current_week():
    today = datetime.now()
    week = weeks_col.find_one({
        'start_date': {'$lte': today},
        'end_date': {'$gte': today}
    })
    return week

def print_week_content_and_quiz():
    week = get_current_week()
    if not week:
        print("No week found for the current date.")
        return
    print(f"\n=== {week.get('title', 'This Week')} ===")
    print(week.get('description', ''))
    start_date = week['start_date']
    # Print each day (1=Monday, 7=Sunday)
    for day_id in range(1, 8):
        day_date = start_date + timedelta(days=day_id-1)
        day_name = day_date.strftime('%A, %Y-%m-%d')
        print(f"\n=== {day_name} ===")
        sections = list(sections_col.find({'day_id': day_id}))
        if sections:
            for level in ['beginner', 'college', 'advanced']:
                sec = next((s for s in sections if s.get('level') == level), None)
                if sec:
                    print(f"\n[{level.capitalize()}]")
                    print(f"Title: {sec.get('title', '')}")
                    print(sec.get('content', 'No content field.'))
        else:
            print("No content found.")

        quiz = quizzes_col.find_one({'day_id': day_id})
        if quiz and quiz.get('questions'):
            print("\nQuiz:")
            print(f"Title: {quiz.get('title', 'No title')}")
            for idx, q in enumerate(quiz['questions'], 1):
                print(f"Q{idx}: {q['question']}")
                for opt_idx, opt in enumerate(q['options'], 1):
                    print(f"   {opt_idx}. {opt}")
                print(f"Answer: {q.get('correct_answer', 'N/A')}")
        else:
            print("No quiz found.")

if __name__ == "__main__":
    print_week_content_and_quiz()
