# Prakriti: Technical Flow Overview

## App Overview
Prakriti is a gamified mobile app for environmental education targeting Indian students. It features school-based authentication, themed weekly quests with daily sets (7 days, 3 types: logging-based repeatable activities, weekly social challenges, lessons/quizzes with stages), Karma points, streaks, badges, a global leaderboard, and the "Keechak" narrative (a pollution mascot weakened by collective actions). Built with React Native (Expo) for frontend, FastAPI (Python) for backend, MongoDB for storage, and Heroku/Vercel for deployment.

The technical flow supports: authentication (school-based) → weekly themed engagement → reward tracking → global/school impact visualization. Offline support via AsyncStorage.

The teacher portal is a separate ReactJS web app, allowing teachers to add, modify, or delete course content (themed weeks, daily activities, lessons/stages, quizzes/questions).

## High-Level Architecture (App Backend)
- **Backend**: FastAPI (Python) for APIs. Storage: MongoDB (cloud-hosted, e.g., MongoDB Atlas).
- **Authentication**: JWT tokens, school-based user roles (student/teacher).
- **Deployment**: Heroku/Vercel (PaaS) for rapid backend hosting.
- **Data Flow**: User actions → API calls → MongoDB updates → Real-time sync (mock for MVP).

## High-Level Architecture (Teacher Portal Backend)
- Shared backend with app, but additional teacher-only endpoints for course management.
- Role-based access control (RBAC) to restrict edits to teachers.

## Key Screens & User Flow
1. **Login Screen**: School-based auth → Dashboard.
2. **Dashboard**: Weekly quests display + Keechak status.
3. **Profile/Badges**: View streaks, points, unlockables, school details.
4. **Leaderboard**: Global and school-specific rankings.

**User Journey Flow**: On app launch: Check JWT token (local storage). If expired or no school, redirect to Login. Post-login: Fetch school-specific weekly quests → Display on Dashboard. Complete quest: Local update + API sync → Earn Karma → Update streaks/badges. View impact: Fetch Keechak health (global) + school progress → Animate shrink.

## Key Screens & User Flow (Teacher Portal)
1. **Login Screen**: Teacher auth → Course Dashboard.
2. **Course Dashboard**: List themed weeks → Add/Modify/Delete.
3. **Edit Screen**: Modify daily sets (logging activities, social challenges, lessons/stages, quizzes).
4. **Preview Screen**: View changes.

**Teacher Journey Flow**: Login → Course Dashboard. Select week/day → Edit content → Preview → Save.

---

# Technical Flow for Core Features

### 1. School-Based Authentication
- **Description**: Users log in with school credentials for personalized quests and clan competition. Teachers have edit access.
- **Flow**:
  1. User opens Login Screen → POST `/api/auth/login` (body: `{school_id, email, password}`).
  2. Backend: Validate DB → Generate JWT with `user_id`, `school_id`, role (student/teacher).
  3. Response: `{token, user: {id, name, school_name, role}}` → Store in AsyncStorage (app) or localStorage (portal).
  4. Dashboard load: GET `/api/user/profile/{user_id}` → Fetch school data.
  5. Logout: DELETE `/api/auth/logout` → Clear storage.
- **MongoDB Model**:
  - `schools`: `{ _id, name, city, admin_id }`
  - `users`: `{ _id, email, password_hash, school_id, role, karma_total: 0, streak_count: 0, last_completion_date: null }`

### 2. Themed Weekly Quests
- **Description**: Weekly themes with 7 daily sets: Logging (2-3 repeatable low-point activities), Social (weekly challenge), Lessons/Quizzes (stages: basic/read more/dive deeper; quiz with 1 easy/2 med/2 hard questions).
- **Flow**:
  1. User opens Dashboard → GET `/api/quests/weekly?school_id={school_id}&week={week_id}`.
  2. Backend: Query `quests` for current week’s daily sets → Return `{quest_id, title, description, points, category (logging/social/lesson), day_id, week_id, stage (basic/read_more/dive_deeper for lessons)}`.
  3. Complete quest → POST `/api/quests/complete/{quest_id}` (body: `{user_id, proof?}`).
  4. Backend: Validate → Update `user_quests` → Add Karma → Update streak.
  5. Response: `{success: true, karma_earned: 15, new_streak: 3}` → Animate reward.
- **MongoDB Model**:
  - `weeks`: `{ _id, name (e.g., "Jal Jagrukta Week"), start_date, end_date }`
  - `quests`: `{ _id, title, points, category, school_id, week_id, day_id, stage (for lessons), created_at }`
  - `user_quests`: `{ _id, user_id, quest_id, completed_at, proof_url }`

### 3. Karma Points & Streaks
- **Description**: Earn points per quest; streaks for consecutive days, tracked per school.
- **Flow**:
  1. On quest completion → Calculate Karma (base + bonuses).
  2. POST `/api/user/update-karma` (body: `{user_id, points}`).
  3. Check streak: Query `users` for last completion → Increment `streak_count`.
  4. Frontend: GET `/api/user/profile/{user_id}` → Display Karma/streak.
  5. Weekly reset: Cron job updates `quests` on Monday midnight IST.
- **MongoDB Model**: `users`: `{ _id, karma_total: 0, streak_count: 0, last_completion_date: null, school_id }`

### 4. Badges & Unlockables
- **Description**: Badges for milestones (e.g., "7-Day Eco-Warrior"), school-specific variants.
- **Flow**:
  1. On Karma/streak update → POST `/api/badges/unlock` (auto-triggered).
  2. Backend: Insert into `user_badges` → Return `{name, image_url, share_text, school_tag}`.
  3. Frontend: GET `/api/badges/user/{user_id}` → Display with Lottie animation.
  4. Share: Native share sheet → "I earned [Badge] at [School] on Prakriti!".
- **MongoDB Model**:
  - `badges`: `{ _id, name, threshold_type, image_url, school_id }`
  - `user_badges`: `{ _id, user_id, badge_id, unlocked_at }`

### 5. Global Leaderboard
- **Description**: Nationwide ranking by Karma, with school filters.
- **Flow**:
  1. View Leaderboard → GET `/api/leaderboard/global?school_id={school_id}&limit=100`.
  2. Backend: Aggregate `users` by `karma_total DESC` → Filter by `school_id` → Anonymize.
  3. Response: `{rank, username, karma, school_name}` → Render with animations.
  4. Refresh: Pull-to-refresh re-fetches.
- **MongoDB Model**: `users` (index on `karma_total`).

### 6. The Fight Against Keechak
- **Description**: Global metric; Keechak's health decreases with Karma, tracking school contributions.
- **Flow**:
  1. On Karma earn → Aggregate daily Karma → Update `global_metrics`.
  2. View Dashboard → GET `/api/keechak/status?school_id={school_id}` → `{health: 750, daily_progress: 250, school_contrib: 50, message}`.
  3. Frontend: Render health bar + Lottie animation.
  4. Sync: Cron job tallies end-of-day.
- **MongoDB Model**: `global_metrics`: `{ _id: "keechak", health: 1000, total_karma_earned: 0, last_updated: ISODate() }`

---

# Teacher Portal Backend Features
- **Description**: Teacher-only endpoints for course management (add/modify/delete themed weeks, daily activities, lessons/stages, quizzes/questions).
- **Flow**:
  1. Teacher logs in → GET `/api/courses` (role: teacher) → List weeks.
  2. Edit week/day → GET `/api/quests/weekly?school_id={school_id}&week={week_id}`.
  3. Add/Modify/Delete: POST `/api/quests/add` (body: `{title, points, category, day_id, stage}`), PUT `/api/quests/update/{quest_id}`, DELETE `/api/quests/delete/{quest_id}`.
  4. Quiz management: POST `/api/quizzes/add` (body: `{quest_id, questions: [{text, difficulty (easy/med/hard)}]}`).
  5. Preview: GET `/api/preview/weekly?school_id={school_id}&week={week_id}` → Simulate student view.
- **MongoDB Model Updates**:
  - `quizzes`: `{ _id, quest_id, questions: [{text, difficulty, answer}] }`
  - Add `editor_id` to `quests` for tracking changes.

---

# API Endpoints Table
| Endpoint                  | Method | Description                              | Request Body (if any)                | Response Example                        |
|---------------------------|--------|------------------------------------------|--------------------------------------|-----------------------------------------|
| `/api/auth/login`         | POST   | Authenticate user/teacher                | `{school_id, email, password}`       | `{token, user: {id, name, school_name}}`|
| `/api/auth/logout`        | DELETE | Logout user/teacher                      | `{user_id}`                          | `{success: true}`                       |
| `/api/user/profile/{user_id}` | GET  | Fetch user/teacher profile               | -                                    | `{id, name, karma_total, streak_count}` |
| `/api/user/update-karma`  | POST   | Update user Karma                        | `{user_id, points}`                  | `{success: true, karma_earned: 15}`     |
| `/api/quests/weekly`      | GET    | Fetch weekly quests/courses              | `?school_id={school_id}&week={week_id}` | `[{quest_id, title, points, category}]` |
| `/api/quests/complete/{quest_id}` | POST | Mark quest as complete (app)             | `{user_id, proof?}`                  | `{success: true, karma_earned: 15}`     |
| `/api/quests/add`         | POST   | Add new quest (portal)                   | `{title, points, category, day_id, stage}` | `{success: true, quest_id}`             |
| `/api/quests/update/{quest_id}` | PUT  | Update quest (portal)                    | `{title, points, category, day_id, stage}` | `{success: true}`                       |
| `/api/quests/delete/{quest_id}` | DELETE | Delete quest (portal)                    | -                                    | `{success: true}`                       |
| `/api/quizzes/add`        | POST   | Add quiz to quest (portal)               | `{quest_id, questions: [{text, difficulty}]}` | `{success: true, quiz_id}`              |
| `/api/preview/weekly`     | GET    | Preview weekly content (portal)          | `?school_id={school_id}&week={week_id}` | `[{quest_id, title, points, category}]` |
| `/api/badges/unlock`      | POST   | Unlock badge on threshold                | - (auto-triggered)                   | `{badge: {name, image_url, school_tag}}`|
| `/api/badges/user/{user_id}` | GET  | Fetch user badges                        | -                                    | `[{name, image_url, unlocked_at}]`      |
| `/api/leaderboard/global` | GET    | Fetch global/school leaderboard          | `?school_id={school_id}&limit=100`   | `[{rank, username, karma, school_name}]`|
| `/api/keechak/status`     | GET    | Fetch Keechak health status              | `?school_id={school_id}`             | `{health: 750, daily_progress: 250}`    |
| `/api/courses`            | GET    | Fetch all courses (portal)               | -                                    | `[{week_id, name, days: [{day_id, quests}]}]` |

---

# Required MongoDB Tables/Collections with Fields

- **schools**: 
  - `_id`
  - `name` (string)
  - `city` (string)
  - `admin_id` (ObjectId, reference to users)
- **users**: 
  - `_id`
  - `email` (string)
  - `password_hash` (string)
  - `school_id` (ObjectId, reference to schools)
  - `role` (string: "student" or "teacher")
  - `karma_total` (number, default: 0)
  - `streak_count` (number, default: 0)
  - `last_completion_date` (ISODate, nullable)
- **weeks**: 
  - `_id`
  - `name` (string, e.g., "Jal Jagrukta Week")
  - `start_date` (ISODate)
  - `end_date` (ISODate)
- **quests**: 
  - `_id`
  - `title` (string)
  - `points` (number)
  - `category` (string: "logging", "social", "lesson")
  - `school_id` (ObjectId, reference to schools)
  - `week_id` (ObjectId, reference to weeks)
  - `day_id` (number, 1-7)
  - `stage` (string for lessons: "basic", "read_more", "dive_deeper")
  - `created_at` (ISODate)
  - `editor_id` (ObjectId, reference to users)
- **user_quests**: 
  - `_id`
  - `user_id` (ObjectId, reference to users)
  - `quest_id` (ObjectId, reference to quests)
  - `completed_at` (ISODate)
  - `proof_url` (string, nullable)
- **quizzes**: 
  - `_id`
  - `quest_id` (ObjectId, reference to quests)
  - `questions` (array: [{text: string, difficulty: "easy/med/hard", answer: string}])
- **badges**: 
  - `_id`
  - `name` (string)
  - `threshold_type` (string: "karma" or "streak")
  - `image_url` (string)
  - `school_id` (ObjectId, reference to schools)
- **user_badges**: 
  - `_id`
  - `user_id` (ObjectId, reference to users)
  - `badge_id` (ObjectId, reference to badges)
  - `unlocked_at` (ISODate)
- **global_metrics**: 
  - `_id` (string: "keechak")
  - `health` (number, default: 1000)
  - `total_karma_earned` (number, default: 0)
  - `last_updated` (ISODate)

---

# Overall System Flow Diagram (Text-Based)
```
[User Device (React Native App) / Teacher Web Portal (ReactJS)]
          |
          v
[Login Screen] --> [Validate Credentials] --> [Dashboard / Course Dashboard]
          |                                      |
          v                                      v
[Profile/Badges] <-- [Fetch User Data]    [Weekly Quests / Edit Courses] --> [Complete Quest / Modify Content]
          |                                      |
          v                                      v
[Leaderboard] <-- [Fetch Rankings]        [Keechak Update / Preview] --> [Animate Health / Save Changes]
          |
          v
[Share Badge] --> [Native Share]
```

## Security & Scalability Notes
- **Auth**: JWT for endpoints; refresh tokens; RBAC for teacher edits.
- **Data Privacy**: GDPR-compliant (opt-in photo uploads); anonymize leaderboard.
- **Offline**: Redux Persist for quests/Karma; sync on online.
- **Performance**: FastAPI async; MongoDB indexes on `school_id`, `user_id`, `karma_total`.
- **MVP Testing**: Postman for APIs; Expo Go for app preview.

This flow aligns with NEP 2020's experiential goals, leveraging MongoDB for flexible, school-specific data.