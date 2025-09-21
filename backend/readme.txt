Steps to test/run the program.

0   create a .env fike in the root directory of BACKEND and paste the following code
    # MongoDB Configuration
    MONGODB_URI="mongodb+srv://Brave:Ug1mbn5T8ALfHLgS@auth.fzjv1an.mongodb.net/"
    MONGO_DB_NAME="Auth"

    # JWT (JSON Web Token) Configuration
    JWT_SECRET_KEY="c891b7e4a187b629088a2a05d8091a18c8b4a24208a0d2a84e3a097d91e63a1f"
    JWT_ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES="60"
    
1   run main.py
2   press ctrl+shift+`
3   in new terminal run -> python -m http.server 8080 --directory public
4   open http://localhost:8080/



============================
Karma Points System
============================

- Signup Bonus: Every new user receives +50 karma upon account creation.
- Daily Login Bonus: +5 karma is automatically awarded for the first login each day.

Quiz Karma Logic:
- Daily Quizzes (`category: 'daily'`):
    - Users earn +10 karma for each correct answer.
    - No karma is deducted for wrong answers.
- Keechak Quizzes (`category: 'keechak'`):
    - Users lose 10 karma for each wrong answer.
    - No karma is awarded for correct answers.

Karma is updated immediately after quiz submission, and the results (karma earned/deducted) are shown to the user.


============================
Badge Names & Unlock Conditions
============================

Streak-Based Badges:
- Eco Newbie: 1-day login streak
- Eco Enthusiast: 3-day login streak
- Eco Warrior: 7-day login streak
- Eco Champion: 14-day login streak
- Eco Legend: 30-day login streak

Karma/Points-Based Badges:
- Green Sprout: Earn 100 Karma points
- Tree Planter: Earn 250 Karma points
- Water Saver: Earn 500 Karma points
- Plastic Buster: Earn 1000 Karma points
- Earth Guardian: Earn 2000 Karma points

Quest Completion Badges:
- Quest Beginner: Complete 1 quest
- Quest Explorer: Complete 10 quests
- Quest Master: Complete 25 quests

Social/Leaderboard Badges:
- Team Player: Participate in a group activity
- School Star: Reach top 3 in school leaderboard
- Punjab Pride: Reach top 10 in Punjab leaderboard

Themed/Seasonal Badges:
- Jal Jagrukta Hero: Complete all water week quests
- Plastic Mukti Hero: Complete all plastic week quests
- Vayu Shuddhi Hero: Complete all air week quests
- Bhoomi Sanrakshan Hero: Complete all land week quests


============================
API Endpoints
============================

- POST /signup
  Register a new user. Requires: name, age, gender, phone, email, password, school_id.
  Returns: access token and user info on success.

- POST /login
  User login. Requires: email, password.
  Returns: access token and user info on success.

- GET /me
  Get current user profile. Requires: Authorization header (Bearer token).
  Returns: user profile data.

- GET /institutes
  Get list of all institutes (schools/colleges).
  Returns: array of institute objects.

- GET /learning/content
  Get lessons and quizzes for the current user for the current (or specified) week/day.
  Requires: Authorization header (Bearer token).
  Optional query params: week_id, day_id.
  Returns: lessons and quizzes with completion status.

- POST /learning/quiz/submit
  Submit quiz answers. Requires: Authorization header (Bearer token).
  Body: quiz_id, answers (array of selected option indices).
  Returns: quiz results, karma earned/deducted, and feedback.

- POST /learning/complete
  Mark a lesson as completed. Requires: Authorization header (Bearer token).
  Body: quest_id (lesson id).
  Returns: completion confirmation.

- GET /db-status
  Check database connection status. Returns: status info.


