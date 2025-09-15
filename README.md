# Prakriti: Let's Heal Our Planet, One Challenge at a Time!

## Problem Statement

Despite the rising urgency of climate change and environmental degradation, environmental education remains largely theoretical in many Indian schools and colleges. Students are often taught textbook-based content with little emphasis on real-world application, local ecological issues, or personal responsibility. There is a lack of engaging tools that motivate students to adopt eco-friendly practices or understand the direct consequences of their lifestyle choices. Traditional methods fail to instill sustainable habits or inspire youth participation in local environmental efforts.

### The Problem (Simplified)
* **Boring Textbooks:** Environmental education in India is often stuck in books, disconnected from the real world. Students learn facts but don't feel inspired to act.
* **No Real-World Connection:** There's a huge gap between knowing about climate change and actually doing something like segregating waste or conserving water.
* **Lost Motivation:** Without engaging tools, students aren't motivated to adopt green habits. The urgency is lost in theoretical lessons.

## Our Solution: Prakriti!

Welcome to Prakriti an app that makes saving the planet fun and addictive, just like Duolingo makes learning a language! We're turning eco-education into a nationwide game.

* **Learn & Act:** Bite-sized, interactive lessons on local environmental issues.
* **Gamified Challenges:** Real-world tasks like planting a sapling, segregating waste, or having a no-plastic day.
* **Fight for Good:** A negative mascot, "Keechak" (the spirit of pollution!), grows stronger every day. Players team up to weaken him by completing challenges and maintaining their "green streaks"!

## MVP Core Features

For our MVP, we're focusing on the core gameplay loop:

* **Daily Green Quests:** A simple, rotating list of actionable tasks to build habits.
* **Karma Points & Streaks:** Users earn points for each quest and build a personal streak for consecutive days of activity.
* **Badges & Unlockables:** Reward users with cool, shareable badges for hitting streak milestones (e.g., "7-Day Eco-Warrior," "30-Day Planet Hero") and achieving Karma point levels.
* **Global Leaderboard:** A single, nationwide leaderboard to foster a sense of collective competition and progress.
* **The Fight Against Keechak:** Keechak's health will be a global metric that decreases as users collectively earn Karma Points. A simple, powerful visual of our shared impact.

_(Features like City-vs-City competitions and Teacher Dashboards are planned for future versions!)_

## MVP Plan & Tech Stack

Our plan is focused on rapid development and a functional prototype with flexible roles.

### Frontend
The frontend team's priority is to build a slick, intuitive, and engaging user experience. By using React Native with Expo, we can develop quickly for both iOS and Android from a single codebase. The focus will be on the core screens that drive the user journey, using animations to make the app feel alive and rewarding.

| Task/Responsibility | Technology/Tools |
| :--- | :--- |
| Build Core UI/UX | React Native, Expo |
| Simple State Management | React Context API |
| Engaging Animations | Lottie |
| Implement Key Screens | Login, Dashboard, Leaderboard, Profile/Badges |

### Backend
The backend team is responsible for creating a fast and reliable engine for the app. FastAPI is chosen for its high performance and ease of use, which is perfect for a hackathon. They will build the API endpoints that the frontend will communicate with, implementing the core game mechanics that make Prakriti engaging.

| Task/Responsibility | Technology/Tools |
| :--- | :--- |
| Develop Core API | Python, FastAPI |
| Database Management | PostgreSQL |
| Implement Game Logic | Streaks, Karma, Badges, Keechak's Health |
| User Authentication | JWT or similar |

### Infrastructure/Deployment
This role is critical for bringing our project to life. The goal is to get the backend running in the cloud as quickly as possible. Using a Platform-as-a-Service (PaaS) like Heroku or Vercel abstracts away complex server management, allowing us to deploy with a few commands and ensuring our app is accessible for the final demo.

| Task/Responsibility | Technology/Tools |
| :--- | :--- |
| Rapid Backend Deployment | Heroku / Vercel (PaaS) |
| Database Setup | Cloud-hosted PostgreSQL (e.g., on Heroku) |
| Ensure App is Live | |

## Why It Will Work

* **Taps into Competition:** Leaderboards and streaks create a powerful motivation to participate daily.
* **Story-Driven & Interactive:** We're not just a task list. A compelling story (fighting Keechak) and high interactivity keep users hooked, which is crucial for today's short attention spans.
* **Makes Impact Visible:** Seeing "Keechak" shrink gives users instant, gratifying feedback that their actions matter.
* **Community Power:** Pits cities and schools against each other for a common good, fostering a sense of collective responsibility.
* **NEP 2020 Aligned:** Perfectly fits the national push for experiential and hands-on learning.

## Impact & Vision

Our goal is to create a generation of environmentally conscious citizens. With Prakriti, we can:

* **Empower Youth:** Give students the tools to make a tangible difference.
* **Build Green Habits:** Turn one-time actions into lifelong sustainable practices.
* **Create a Greener India:** Foster a nationwide movement where every small action contributes to a larger, positive change.

***
_Join us, and let's turn every student into an Eco-Warrior!_