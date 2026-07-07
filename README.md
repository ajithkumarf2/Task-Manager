# 📋 Task Manager

A full-stack project management application with workspaces, task tracking, analytics, AI-powered task suggestions, and team collaboration.

---

## 🚀 Features

- **Authentication** — JWT-based login and signup
- **Workspaces & Projects** — Organize work into projects within a shared workspace
- **Task Management** — Create, edit, delete, and filter tasks with status, priority, type, and assignee
- **AI Suggest** — Gemini AI auto-generates task descriptions and suggests priorities
- **Analytics** — Recharts-powered project analytics dashboard
- **Calendar View** — Visual calendar for task due dates
- **Team Management** — Invite team members, assign tasks, view member activity
- **Dark Mode** — Full light/dark theme with toggle
- **Real-time UI** — Optimistic Redux state updates without page refresh

---

## 🛠️ Tech Stack

### Frontend (`/Client`)
| Technology | Why |
|---|---|
| **React 19** | Component-based UI with the latest concurrent features |
| **Vite** | Extremely fast dev server and build tool |
| **Redux Toolkit** | Predictable global state for workspace, tasks, projects |
| **React Router v7** | Client-side routing for multi-page navigation |
| **Tailwind CSS v4** | Utility-first styling for rapid, consistent UI |
| **Recharts** | Declarative charting library for analytics views |
| **Lucide React** | Clean, consistent icon set |
| **Axios** | HTTP client with request interceptors for JWT auth |
| **React Hot Toast** | Lightweight toast notifications |
| **date-fns** | Immutable date utility library for calendar logic |

### Backend (`/Server`)
| Technology | Why |
|---|---|
| **Node.js + Express** | Lightweight, fast REST API server |
| **Sequelize ORM** | Model-based MySQL interactions with auto-migration |
| **MySQL** | Relational database for structured task/project data |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcryptjs** | Secure password hashing |
| **Google Gemini AI** | AI-powered task description and priority suggestions |
| **Nodemon** | Auto-restart server during development |

---

## ⚙️ How to Run Locally

### Prerequisites
- Node.js v18+
- MySQL 8+ (running locally)
- A Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/task-manager.git
cd task-manager
```

---

### 2. Set Up the Backend (`/Server`)

```bash
cd Server
npm install
```

Create a `.env` file inside `/Server`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=task_manager

JWT_SECRET=your_jwt_secret_key

GEMINI_API_KEY=your_google_gemini_api_key
```

> ⚠️ Create a MySQL database named `task_manager` before starting the server. The server auto-creates all tables using Sequelize sync.

```sql
CREATE DATABASE task_manager;
```

Start the backend:

```bash
npm run server
```

The API will be running at `http://localhost:5000`.

---

### 3. Set Up the Frontend (`/Client`)

```bash
cd ../Client
npm install
```

Create a `.env` file inside `/Client`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

---

## 🤖 AI Tools & Resources Used

| Tool / Resource | Usage |
|---|---|
| **Google Gemini AI (`@google/generative-ai`)** | Backend AI endpoint that generates task descriptions and recommends priority levels based on the task title |
| **Antigravity (AI Coding Assistant)** | Used throughout development for debugging, feature implementation (user dropdown, edit task sync, team invite error handling), and writing this README |
| **Lucide React Icons** | Pre-built icon library used across all UI components |
| **Recharts** | Used for bar charts and analytics visualizations in the project dashboard |

---

## ✨ One Thing I Would Improve With More Time

**Real-time Collaboration with WebSockets**

Currently, all updates (new tasks, status changes, member invites) are local to the user's session and require a page refresh to sync for other users. With more time, I would integrate **Socket.IO** to push real-time updates to all connected team members — so if one user changes a task status, everyone in the workspace sees it instantly without refreshing. This would make the app feel like a true collaborative tool (similar to Linear or Notion).

---

## 📁 Project Structure

```
task-manager/
├── Client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── features/        # Redux slices (workspace, theme)
│   │   ├── context/         # Auth context + Axios instance
│   │   └── assets/          # Static assets
│   └── package.json
│
└── Server/                  # Express + Sequelize backend
    ├── controllers/         # Route handler logic
    ├── models/              # Sequelize models (Task, Project, User)
    ├── routes/              # Express route definitions
    ├── middleware/          # JWT auth middleware
    ├── config/              # Database configuration
    └── server.js            # App entry point
```
