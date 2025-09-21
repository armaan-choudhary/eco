import os
from pymongo import MongoClient
from datetime import datetime

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://Admin:BioStorm@sih-project.5u3ahnv.mongodb.net/')
DB_NAME = os.getenv('MONGO_DB_NAME_CONTENT', 'prakriti_content')

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
quizzes = db['quizzes']

now = datetime.utcnow()

result = quizzes.update_many({}, {'$set': {'category': 'daily', 'updated_at': now}})
print(f"Updated {result.modified_count} quizzes: set category='daily'.")
