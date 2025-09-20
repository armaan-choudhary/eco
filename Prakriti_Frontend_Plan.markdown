# Prakriti: Frontend Plan Overview

## App Overview
The Prakriti frontend is a React Native (Expo) application targeting Indian students for eco-education. It features school-based authentication, themed weekly quests with daily sets (7 days, 3 types: logging-based repeatable activities, weekly social challenges, lessons/quizzes with stages), Karma points, streaks, badges, a global leaderboard, and the "Keechak" narrative, as defined in the backend plan ("Prakriti_Technical_Flow.md"). The UI emphasizes engaging animations (Lottie), intuitive navigation, and offline support (AsyncStorage), integrating with the FastAPI backend and MongoDB storage.

Additionally, a separate ReactJS web-based teacher portal allows teachers to add, modify, or delete course content (e.g., lessons, activities, quizzes). The portal is built with ReactJS, TailwindCSS, and Axios for API calls.

The frontend plan focuses on: responsive design → interactive user journey → real-time feedback → cross-platform compatibility (iOS/Android for app, web for portal).

## High-Level Architecture (App)
- **Framework**: React Native with Expo for cross-platform development.
- **State Management**: React Context API for global state (e.g., user profile, quests).
- **Animations**: Lottie for smooth, gamified transitions (e.g., Keechak shrink, badge unlocks).
- **Offline Support**: AsyncStorage for caching quests and user data.
- **Integration**: REST API calls to FastAPI endpoints (see "Prakriti_Technical_Flow.md").
- **Styling**: TailwindCSS via NativeWind for consistent, rapid styling.

## High-Level Architecture (Teacher Portal - ReactJS)
- **Framework**: ReactJS with Vite for fast web development.
- **State Management**: React Context API or Redux for portal state (e.g., courses, edits).
- **UI Library**: No heavy libraries; use TailwindCSS for styling.
- **Integration**: Axios for API calls to the same FastAPI backend.

## Key Screens & User Flow (App)
1. **Login Screen**: School-based auth input → Dashboard.
2. **Dashboard**: Weekly quests display (7 day sets with 3 types: logging, social, lessons/quizzes) + Keechak health.
3. **Profile/Badges**: Streaks, points, and school-specific badges.
4. **Leaderboard**: Global and school rankings.

**User Journey Flow (App)**:
- Launch: Check local storage for JWT; redirect to Login if invalid.
- Login: Submit credentials → Fetch user data → Navigate to Dashboard.
- Dashboard: View themed week quests (daily logging activities, weekly social challenge, lessons with stages: basic/read more/dive deeper, quizzes with 1 easy/2 med/2 hard) → Complete tasks → See real-time updates (Karma, Keechak).
- Profile/Leaderboard: Access personal stats or rankings with animations.

## Key Screens & User Flow (Teacher Portal)
1. **Login Screen**: Teacher auth → Course Dashboard.
2. **Course Dashboard**: List themed weeks/courses → Add/Modify/Delete.
3. **Edit Screen**: Modify lessons (basic/read more/dive deeper), activities (logging/social), quizzes (questions by difficulty).
4. **Preview Screen**: View changes as student would see.

**User Journey Flow (Portal)**:
- Login: Teacher credentials → Course Dashboard.
- Dashboard: Select themed week → Edit daily sets (add/modify/delete logging activities, social challenges, lessons/stages, quizzes).
- Edit: Real-time preview → Save changes via API.
- Logout: Clear session.

---

# Frontend Design & Implementation (App)

### 1. Login Screen
- **Purpose**: Handle school-based authentication (per "Prakriti_Technical_Flow.md").
- **Components**:
  - TextInput for school ID, email, password.
  - Button (styled with TailwindCSS) for submission.
  - Loading spinner (Lottie) during API call.
- **Flow**:
  1. User inputs credentials → Validate locally (e.g., email format).
  2. POST to `/api/auth/login` → Store JWT in AsyncStorage.
  3. On success, navigate to Dashboard with fade animation.
- **Design Notes**: Minimalist layout, green theme (#28a745), error alerts via Toast.
- **Edge Case**: Offline → Show cached user data; prompt re-auth on reconnect.

### 2. Dashboard
- **Purpose**: Display themed weekly quests with daily sets and Keechak status (per "Prakriti_Technical_Flow.md").
- **Components**:
  - Header with school name and Keechak health bar (Lottie animation).
  - TabView for 7 days, each with 3 categories: Logging (2-3 repeatable low-point activities), Social (weekly challenge), Lessons/Quizzes (stages: basic/read more/dive deeper; quiz with 1 easy/2 med/2 hard).
  - Expandable cards (Tailwind-styled) for lessons (click 'read more'/'dive deeper' for deeper content) and quizzes.
- **Flow**:
  1. Load: GET `/api/quests/weekly?school_id={school_id}&week={week_id}` → Populate 7 day sets.
  2. User completes activity/quiz → POST `/api/quests/complete/{quest_id}` → Update UI.
  3. Fetch `/api/keechak/status?school_id={school_id}` → Animate health bar reduction.
- **Design Notes**: Responsive tabs, interactive cards with expand/collapse, real-time updates.
- **Edge Case**: Offline → Show cached quests; sync on online.

### 3. Profile/Badges
- **Purpose**: Show user progress and unlockables (per "Prakriti_Technical_Flow.md").
- **Components**:
  - ProfileHeader with name, Karma, streak.
  - GridView for badges (Lottie unlock animation on fetch).
  - ShareButton (React Native Share) for badges.
- **Flow**:
  1. Load: GET `/api/user/profile/{user_id}` → Display stats.
  2. Fetch `/api/badges/user/{user_id}` → Render badge grid.
  3. Tap ShareButton → Pre-fill "I earned [Badge] at [School] on Prakriti!".
- **Design Notes**: Circular profile image, badge hover effects.
- **Edge Case**: No badges → Show placeholder with motivational text.

### 4. Leaderboard
- **Purpose**: Display global and school rankings (per "Prakriti_Technical_Flow.md").
- **Components**:
  - TabNavigator (global/school views).
  - ListView with ranked users (Tailwind-styled rows).
  - RefreshControl for pull-to-refresh.
- **Flow**:
  1. Load: GET `/api/leaderboard/global?school_id={school_id}&limit=100` → Populate list.
  2. Switch tabs → Filter by `school_id`.
  3. Pull-to-refresh → Re-fetch data with animation.
- **Design Notes**: Sorted list, color-coded ranks (green for top 10).
- **Edge Case**: Large dataset → Limit to 100, add "Load More" button.

---

# Frontend Design & Implementation (Teacher Portal - ReactJS)

### 1. Login Screen
- **Purpose**: Handle teacher authentication.
- **Components**:
  - Input fields for school ID, email, password.
  - Submit button (Tailwind-styled).
- **Flow**:
  1. Submit credentials → POST to `/api/auth/login` → Store JWT in localStorage.
  2. Navigate to Course Dashboard.
- **Design Notes**: Responsive form, green theme.

### 2. Course Dashboard
- **Purpose**: List themed weeks/courses for editing.
- **Components**:
  - TableView for weeks (e.g., "Jal Jagrukta Week").
  - Buttons for add/modify/delete.
- **Flow**:
  1. Load: GET `/api/courses` → Display list.
  2. Click week → Navigate to Edit Screen.
- **Design Notes**: Grid layout, searchable table.

### 3. Edit Screen
- **Purpose**: Modify lessons, activities, quizzes.
- **Components**:
  - Tabs for 7 days, each with sections for Logging (2-3 activities), Social (weekly challenge), Lessons (basic/read more/dive deeper), Quizzes (1 easy/2 med/2 hard questions).
  - Form fields for add/modify/delete (e.g., text editors for lesson stages, question builders for quizzes).
- **Flow**:
  1. Load day data: GET `/api/quests/weekly?school_id={school_id}&week={week_id}`.
  2. Edit content → POST to `/api/quests/update/{quest_id}` or similar backend endpoints.
  3. Preview changes → Save.
- **Design Notes**: Expandable sections, real-time preview pane.

### 4. Preview Screen
- **Purpose**: View edits as student app.
- **Components**:
  - Simulated app view with quests, lessons, quizzes.
- **Flow**:
  1. Load edited data → Render mobile-like preview.
- **Design Notes**: Responsive iframe-style preview.

---

# Frontend Integration & Testing

## API Integration Table
| Endpoint                  | Method | Purpose                              | Action                          |
|---------------------------|--------|--------------------------------------|---------------------------------|
| `/api/auth/login`         | POST   | Authenticate user/teacher            | Store JWT, navigate to Dashboard |
| `/api/user/profile/{user_id}` | GET  | Fetch user/teacher profile           | Update Profile screen           |
| `/api/quests/weekly`      | GET    | Fetch weekly quests/courses          | Populate Dashboard/Edit Screen  |
| `/api/quests/complete/{quest_id}` | POST | Mark quest complete (app)            | Update quest status, Karma      |
| `/api/quests/update/{quest_id}` | POST | Update quest (portal)                | Save edits to courses           |
| `/api/badges/user/{user_id}` | GET  | Fetch user badges                    | Render Badge grid               |
| `/api/leaderboard/global` | GET    | Fetch leaderboard                    | Populate Leaderboard            |
| `/api/keechak/status`     | GET    | Fetch Keechak health                 | Update health bar               |

## Testing Plan
- **Unit Tests**: Jest for component rendering (e.g., QuestCard).
- **Integration Tests**: Detox (app), Cypress (portal) for end-to-end flows (login → quest edit/completion).
- **Performance**: Test on low-end devices (app) and browsers (portal) with Expo Go.
- **Mock Data**: Use local JSON for offline testing of all screens.

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

## Design & Scalability Notes
- **Responsiveness**: TailwindCSS for adaptive layouts across devices/browsers.
- **Performance**: Lazy loading for Leaderboard; memoize heavy components.
- **Accessibility**: ARIA labels for screen readers; high-contrast mode.
- **MVP Testing**: Expo Go for app preview; Postman for API mocks; Storybook for portal components.

This plan ensures an engaging, scalable frontend aligned with NEP 2020 goals, referencing "Prakriti_Technical_Flow.md".