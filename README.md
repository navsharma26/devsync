# DevSync - Production-Ready Collaborative Coding Platform

DevSync is a full-featured, production-ready collaborative development platform built with the MERN stack (MongoDB, Express, React, Node.js), Socket.io, Monaco Editor, and Tailwind CSS.

---

## 🚀 Key Features

- 🔐 **Hardened JWT Authentication**: Bcryptjs password hashing, bearer auth tokens, protected routes, and user session persistence.
- ⏱️ **24-Hour TTL Persistent Workspaces**: Instant room creation with curated problem presets (*Two Sum*, *Valid Palindrome*, *Reverse Linked List*, *Custom*) and automatic 24-hour MongoDB cleanup.
- 💻 **Real-Time Collaborative Monaco Editor**:
  - Embedded `@monaco-editor/react` with dark theme (`vs-dark`).
  - Multi-language support: **JavaScript**, **Python**, **C++**, and **Java** with language-switching sync.
  - Circular broadcast loop prevention with remote update flags.
- 💬 **In-Room Live Chat**:
  - Collapsible right drawer with live message history, timestamps, unread notification counter badge, and auto-scroll.
  - Low-latency real-time broadcasting via Socket.io.
- 💾 **5-Second Debounced Auto-Save**:
  - Real-time cloud persistence to MongoDB `Room` documents 5 seconds after typing stops.
  - Visual status indicator in Top Bar (`Auto-saved`, `Saving...`, `Unsaved`). Zero work lost on page refresh.
- 📥 **Code Export**:
  - 1-click "Export" button automatically downloading `.js`, `.py`, `.cpp`, or `.java` files locally based on active language.
- ⚡ **Safe Code Execution & Interactive Terminal**:
  - Remote code runner forwarding to Piston API with sandboxed isolated fallback for JavaScript and Python.
  - Rate-limited to max 15 runs/min per IP to prevent abuse.
  - Keyboard shortcut: **`Cmd + Enter`** (Mac) or **`Ctrl + Enter`** (Windows/Linux).
  - Terminal console displaying live execution metrics (ms elapsed, memory used, exit status), green stdout, and red runtime errors.

---

## 📁 Project Structure

```
DevSync/
├── client/                     # Vite + React + Tailwind CSS + Monaco Editor + Lucide
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Header with profile dropdown & auth triggers
│   │   │   ├── AuthModal.jsx   # Clean login & register modal
│   │   │   └── ProtectedRoute.jsx # Route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Token persistence & user session state
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page, room creator & active workspaces
│   │   │   ├── RoomPage.jsx    # Collaborative Monaco workspace, chat, and terminal
│   │   │   ├── Dashboard.jsx   # Profile details & socket latency diagnostic
│   │   │   ├── LoginPage.jsx   # Standalone login
│   │   │   └── RegisterPage.jsx# Standalone register
│   │   ├── services/
│   │   │   ├── api.js          # Axios API service (Auth, Rooms, Execution)
│   │   │   └── socket.js       # Socket.io client instance
│   │   ├── App.jsx             # Router definition
│   │   └── index.css           # Tailwind v4 styles and dark mode (#0B0F19)
│   └── package.json
│
├── server/                     # Node.js + Express (ES Modules) + Mongoose + Socket.io
│   ├── config/
│   │   └── db.js               # MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js   # registerUser, loginUser, getMe
│   │   ├── roomController.js   # createRoom, getRoom, updateRoomCode, updateProblem
│   │   └── executeController.js# executeCode (Piston API + Sandbox fallback)
│   ├── middleware/
│   │   └── authMiddleware.js   # protect & optionalProtect
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt pre-save hook
│   │   └── Room.js             # Room schema with 24-hour MongoDB TTL index
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth
│   │   ├── roomRoutes.js       # /api/rooms
│   │   └── executeRoutes.js    # /api/execute (rate-limited 15/min)
│   ├── socket/
│   │   └── index.js            # join-room, code-change, language-change, send-message
│   ├── server.js               # Express + HTTP + Socket.io server
│   └── package.json
│
├── package.json                # Root helper scripts
└── README.md
```

---

## 🏃 Getting Started

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.
