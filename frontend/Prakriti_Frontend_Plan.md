# Prakriti: Frontend Plan Overview

## App Overview
The Prakriti frontend is a React Native (Expo) application targeting Indian students for eco-education. It features school-based authentication, themed weekly quests (e.g., "Jal Jagrukta Week"), Karma points, streaks, badges, a global leaderboard, and the "Keechak" narrative, as defined in the backend plan ("Prakriti_Technical_Flow.md"). The UI emphasizes engaging animations (Lottie), intuitive navigation, and offline support (AsyncStorage), integrating with the FastAPI backend and MongoDB storage.

The frontend plan focuses on: responsive design → interactive user journey → real-time feedback → cross-platform compatibility (iOS/Android).

## High-Level Architecture
- **Framework**: React Native with Expo for cross-platform development.
- **State Management**: React Context API for global state (e.g., user profile, quests).
- **Animations**: Lottie for smooth, gamified transitions (e.g., Keechak shrink, badge unlocks).
- **Offline Support**: AsyncStorage for caching quests and user data.
- **Integration**: REST API calls to FastAPI endpoints (see "Prakriti_Technical_Flow.md").

## Key Screens & User Flow
1. **Login Screen**: School-based auth input → Dashboard.
2. **Dashboard**: Weekly quests display + Keechak health.
3. **Profile/Badges**: Streaks, points, and school-specific badges.
4. **Leaderboard**: Global and school rankings.

**User Journey Flow**:
- Launch: Check local storage for JWT; redirect to Login if invalid.
- Login: Submit credentials → Fetch user data → Navigate to Dashboard.
- Dashboard: View quests → Complete tasks → See real-time updates (Karma, Keechak).
- Profile/Leaderboard: Access personal stats or rankings with animations.

---

# Frontend Design & Implementation

### 1. Login Screen
- **Purpose**: Handle school-based authentication (per "Prakriti_Technical_Flow.md").
- **Components**:
  - TextInput for school ID, email, password.
  - Button (styled with Tailwind CSS) for submission.
  - Loading spinner (Lottie) during API call.
- **Flow**:
  1. User inputs credentials → Validate locally (e.g., email format).
  2. POST to `/api/auth/login` → Store JWT in AsyncStorage.
  3. On success, navigate to Dashboard with fade animation.
- **Design Notes**: Minimalist layout, green theme, error alerts via Toast.
- **Edge Case**: Offline → Show cached user data; prompt re-auth on reconnect.

### 2. Dashboard
- **Purpose**: Display weekly quests and Keechak status (per "Prakriti_Technical_Flow.md").
- **Components**:
  - Header with school name and Keechak health bar (Lottie animation).
  - ScrollView for 3 daily quests (Activity, Knowledge, Social).
  - Card components (Tailwind-styled) for each quest with completion toggle.
- **Flow**:
  1. Load: GET `/api/quests/weekly?school_id={school_id}&week={week_id}` → Populate quests.
  2. User toggles completion → POST `/api/quests/complete/{quest_id}` → Update UI.
  3. Fetch `/api/keechak/status?school_id={school_id}` → Animate health bar reduction.
- **Design Notes**: Responsive grid, interactive cards, real-time updates.
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

# Frontend Integration & Testing

## API Integration Table
| Endpoint                  | Method | Purpose                              | Action                          |
|---------------------------|--------|--------------------------------------|---------------------------------|
| `/api/auth/login`         | POST   | Authenticate user                    | Store JWT, navigate to Dashboard |
| `/api/user/profile/{user_id}` | GET  | Fetch user profile                   | Update Profile screen           |
| `/api/quests/weekly`      | GET    | Fetch weekly quests                  | Populate Dashboard              |
| `/api/quests/complete/{quest_id}` | POST | Mark quest complete                  | Update quest status, Karma      |
| `/api/badges/user/{user_id}` | GET  | Fetch user badges                    | Render Badge grid               |
| `/api/leaderboard/global` | GET    | Fetch leaderboard                    | Populate Leaderboard            |
| `/api/keechak/status`     | GET    | Fetch Keechak health                 | Update health bar               |

## Testing Plan
- **Unit Tests**: Jest for component rendering (e.g., QuestCard).
- **Integration Tests**: Detox for end-to-end flows (login → quest completion).
- **Performance**: Test on low-end devices (e.g., Android 5.0) with Expo Go.
- **Mock Data**: Use local JSON for offline testing of all screens.

---

# Overall System Flow Diagram (Text-Based)
```
[User Device (React Native App)]
          |
          v
[Login Screen] --> [Validate Credentials] --> [Dashboard]
          |                                      |
          v                                      v
[Profile/Badges] <-- [Fetch User Data]    [Weekly Quests] --> [Complete Quest]
          |                                      |
          v                                      v
[Leaderboard] <-- [Fetch Rankings]        [Keechak Update] --> [Animate Health]
          |
          v
[Share Badge] --> [Native Share]
```

## Design & Scalability Notes
- **Responsiveness**: Tailwind CSS for adaptive layouts across devices.
- **Performance**: Lazy loading for Leaderboard; memoize heavy components.
- **Accessibility**: ARIA labels for screen readers; high-contrast mode.
- **MVP Testing**: Expo Go for real-time preview; Postman for API mocks.

This plan ensures an engaging, scalable frontend aligned with NEP 2020 goals, referencing "Prakriti_Technical_Flow.md".