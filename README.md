# Vedam Google Run - Smart Calendar Clone

A powerful, aesthetic Google Calendar clone enhanced with AI-powered task scheduling and smart event management. Built with vanilla JavaScript, Firebase, and Gemini AI.

![Vedam Calendar](https://img.shields.io/badge/Status-Live-green) ![AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue)

## 🌟 Key Features

### 🤖 AI Task Scheduler (Powered by Gemini)

Transform your to-do list into an optimized schedule automatically.

- **Smart Planning**: Takes your tasks, deadlines, and durations and fits them perfectly into your week.
- **Productivity Profiling**: Learns your productive hours, preferred session lengths, and break times to schedule tasks when you're most efficient.
- **Types of Tasks**:
  - **Deadline**: Ensures completion by a specific date.
  - **Daily**: Schedules recurring tasks at consistent times.
  - **One Day**: Locks tasks to specific dates.
- **Conflict Detection**: Automatically warns if AI-generated schedules overlap with existing commitments.

### 📅 Advanced Event Management

- **Category System**: Organize events by Personal, Work, Family, etc.
- **Visibility Toggles**: Filter calendar view by checking/unchecking categories in the sidebar.
- **Custom Categories**: Create, edit, and delete custom categories with personalized colors.
- **Smart Inputs**: Event creation uses category dropdowns instead of manual color picking.

### 🇮🇳 Smart Holiday Integration

- **Auto-Import**: Automatically loads Indian Holidays for 2026.
- **Categorization**: All holidays assigned to "Official Holidays" category.
- **Toggle**: Hide/Show holidays instantly with a single click.

### 🔐 Authentication & Data

- **Firebase Auth**: Secure user accounts (Username based).
- **Firestore Database**: Real-time data syncing across devices.
- **Security**: Data isolation ensures users only see their own events.

---

## 🚀 Getting Started

1. **Clone the repository**
2. **Open `index.html`** in a live server (or simple browser open works too).
3. **Login/Signup**: Enter a unique username to create your workspace.
4. **Onboarding**: Answer 4 quick questions to let the AI know your work style.
5. **Start Planning**: Click "AI Plan Week" in the sidebar!

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Glassmorphism Design), Vanilla JavaScript (ES6+ Modules)
- **Backend/DB**: Firebase Firestore
- **AI**: Google Gemini 1.5 Flash API

## 📂 Project Structure

- `calendar.js`: Core calendar logic (rendering, navigation).
- `events.js`: Event CRUD operations.
- `categories.js`: Category management & filtering logic.
- `ai-planner.js`: Gemini API integration & scheduling logic.
- `onboarding.js`: User preference collection system.
- `holidays.js`: Holiday data & auto-import logic.
- `styles.css`: All application styling.

The AI scheduler uses a sophisticated prompt structure that considers:

- User's productive/unproductive hours.
- Existing calendar events (to avoid double-booking).
- Task flexibility (Fixed vs Flexible times).
- Task urgency (Deadline proximity).

---

_Built for Hackathon_
