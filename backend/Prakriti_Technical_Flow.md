# Prakriti: Technical Flow Overview

## App Overview
Prakriti is a gamified mobile app for environmental education targeting Indian students. It features school-based authentication, themed weekly quests (e.g., "Jal Jagrukta Week" for water), Karma points, streaks, badges, a global leaderboard, and the "Keechak" narrative (a pollution mascot weakened by collective actions). Built with React Native (Expo) for frontend, FastAPI (Python) for backend, MongoDB for storage, and Heroku/Vercel for deployment.

The technical flow supports: authentication (school-based) → weekly themed engagement → reward tracking → global/school impact visualization. Offline support via AsyncStorage.

## High-Level Architecture
- **Frontend**: React Native + Expo (cross-platform iOS/Android). State management: React Context API. Animations: Lottie.
- **Backend**: FastAPI (Python) for APIs. Storage: MongoDB (cloud-hosted, e.g., MongoDB Atlas).
- **Authentication**: JWT tokens, school-based user roles.
- **Deployment**: Heroku/Vercel (PaaS) for rapid backend hosting.
- **Data Flow**: User actions → API calls → MongoDB updates → Real-time sync (mock for MVP).

## Key Screens & User Flow
1. **Login Screen**: School-based auth → Dashboard.
2. **Dashboard**: Weekly themed quests + Keechak status.
3. **Profile/Badges**: View streaks, points, unlockables, school details.
4. **Leaderboard**: Global and school-specific rankings.

**User Journey Flow**:
- On app launch: Check JWT token (local storage). If expired or no school, redirect to Login.
- Post-login: Fetch school-specific weekly quests → Display on Dashboard.
- Complete quest: Local update + API sync → Earn Karma → Update streaks/badges.
- View impact: Fetch Keechak health (global) + school progress → Animate shrink.

---

# Technical Flow for Core Features

### 1. School-Based Authentication
   - **Description**: Users log in with school credentials for personalized quests and clan competition.
   - **Flow**:
     1. User opens Login Screen → POST `/api/auth/login` (body: `{school_id, email, password}`).
     2. Backend: Validate `schools` and `users` → Generate JWT with `user_id`, `school_id`, role.
     3. Response: `{token, user: {id, name, school_name, role}}` → Store in AsyncStorage.
     4. Dashboard load: GET `/api/user/profile/{user_id}` → Fetch school data.
     5. Logout: DELETE `/api/auth/logout` → Clear storage.
   - **MongoDB Model**:
     - `schools`: `{ _id, name, city, admin_id }`
     - `users`: `{ _id, email, password_hash, school_id, role, karma_total: 0, streak_count: 0, last_completion_date: null }`

### 2. Themed Weekly Quests
   - **Description**: Weekly themes with 3 daily tasks: Activity (e.g., plant a tree), Knowledge (e.g., lesson), Social (e.g., teach a friend). Themes: "Jal Jagrukta Week" (water awareness), "Plastic Mukti Week" (plastic freedom), "Vayu Shuddhi Week" (air purification), "Bhoomi Sanrakshan Week" (land conservation).
   - **Flow**:
     1. User opens Dashboard → GET `/api/quests/weekly?school_id={school_id}&week={week_id}`.
     2. Backend: Query `quests` for current week’s tasks → Return `{quest_id, title, description, points, category (activity/knowledge/social), week_id}`.
     3. Daily tasks: 1 Activity (e.g., "Plant a tree: +15 Karma"), 1 Knowledge (e.g., "Learn water cycle: +10 Karma"), 1 Social (e.g., "Teach water saving: +20 Karma").
     4. Complete quest → POST `/api/quests/complete/{quest_id}` (body: `{user_id, proof?}`).
     5. Backend: Validate → Update `user_quests` → Add Karma → Update streak.
     6. Response: `{success: true, karma_earned: 15, new_streak: 3}` → Animate reward.
   - **MongoDB Model**:
     - `weeks`: `{ _id, name (e.g., "Jal Jagrukta Week"), start_date, end_date }`
     - `quests`: `{ _id, title, points, category, school_id, week_id, created_at }`
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

# API Endpoints Table

| Endpoint                  | Method | Description                              | Request Body (if any)                | Response Example                        |
|---------------------------|--------|------------------------------------------|--------------------------------------|-----------------------------------------|
| `/api/auth/login`         | POST   | Authenticate user with school credentials| `{school_id, email, password}`       | `{token, user: {id, name, school_name}}`|
| `/api/auth/logout`        | DELETE | Logout user                              | `{user_id}`                          | `{success: true}`                       |
| `/api/user/profile/{user_id}` | GET  | Fetch user profile                       | -                                    | `{id, name, karma_total, streak_count}` |
| `/api/user/update-karma`  | POST   | Update user Karma                        | `{user_id, points}`                  | `{success: true, karma_earned: 15}`     |
| `/api/quests/weekly`      | GET    | Fetch weekly quests for school           | `?school_id={school_id}&week={week_id}` | `[{quest_id, title, points, category}]` |
| `/api/quests/complete/{quest_id}` | POST | Mark quest as complete                   | `{user_id, proof?}`                  | `{success: true, karma_earned: 15}`     |
| `/api/badges/unlock`      | POST   | Unlock badge on threshold                | - (auto-triggered)                   | `{badge: {name, image_url, school_tag}}`|
| `/api/badges/user/{user_id}` | GET  | Fetch user badges                        | -                                    | `[{name, image_url, unlocked_at}]`      |
| `/api/leaderboard/global` | GET    | Fetch global/school leaderboard          | `?school_id={school_id}&limit=100`   | `[{rank, username, karma, school_name}]`|
| `/api/keechak/status`     | GET    | Fetch Keechak health status              | `?school_id={school_id}`             | `{health: 750, daily_progress: 250}`    |

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
  - `category` (string: "activity", "knowledge", "social")
  - `school_id` (ObjectId, reference to schools)
  - `week_id` (ObjectId, reference to weeks)
  - `created_at` (ISODate)
- **user_quests**: 
  - `_id`
  - `user_id` (ObjectId, reference to users)
  - `quest_id` (ObjectId, reference to quests)
  - `completed_at` (ISODate)
  - `proof_url` (string, nullable)
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
[User Device (React Native App)]
          |
          v
[Login/Auth (JWT, School-Based)] --> [Local Storage Check]
          |
          v
[Dashboard Load] --> GET /api/quests/weekly?school_id + /api/keechak/status
          |
          v
[Quest Completion] --> POST /api/quests/complete --> Update Karma/Streak/Badges
          |                                      |
          v                                      v
[Profile Update] <-- POST /api/user/update     [Badge Unlock] <-- Threshold Check
          |
          v
[Leaderboard View] --> GET /api/leaderboard/global?school_id
          |
          v
[Share/Impact Viz] --> Native Share + Keechak Animation
```

## Security & Scalability Notes
- **Auth**: JWT for endpoints; refresh tokens; school admin role.
- **Data Privacy**: GDPR-compliant (opt-in photo uploads); anonymize leaderboard.
- **Offline**: Redux Persist for quests/Karma; sync on online.
- **Performance**: FastAPI async; MongoDB indexes on `school_id`, `user_id`, `karma_total`.
- **MVP Testing**: Postman for APIs; Expo Go for app preview.

This flow aligns with NEP 2020's experiential goals, leveraging MongoDB for flexible, school-specific data.