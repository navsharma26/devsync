# ⚡ DevSync — Real-Time Collaborative Technical Interview Platform

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Frontend_Live-black?style=for-the-badge&logo=vercel)](https://client-eta-rouge-48.vercel.app)
[![Render Deployment](https://img.shields.io/badge/Render-Backend_Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://devsync-api-05jm.onrender.com/api/health)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Connected-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![WebRTC](https://img.shields.io/badge/WebRTC-Live_Video_&_Audio-333333?style=for-the-badge&logo=webrtc)](https://client-eta-rouge-48.vercel.app)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime_Sync-010101?style=for-the-badge&logo=socket.io)](https://socket.io)

**DevSync** is a production-ready, full-stack collaborative development and mock interview platform built with the MERN stack (**MongoDB**, **Express**, **React**, **Node.js**), **Socket.io**, **WebRTC**, **Monaco Editor**, and **Tailwind CSS**.

---

## 🌐 Live Deployments

| Component | Platform | URL | Status |
|---|---|---|---|
| **Frontend Web App** | **Vercel** | [https://client-eta-rouge-48.vercel.app](https://client-eta-rouge-48.vercel.app) | 🟢 Live |
| **Backend API & WebSockets** | **Render** | [https://devsync-api-05jm.onrender.com](https://devsync-api-05jm.onrender.com) | 🟢 Healthy |
| **Cloud Database** | **MongoDB Atlas** | Connected Dedicated Cluster | 🟢 Active |
| **Source Code** | **GitHub** | [https://github.com/navsharma26/devsync](https://github.com/navsharma26/devsync) | 🟢 Main |

---

## 🎯 Key Capabilities & Highlights

### 1. ✍️ User-Authored Custom Interview Questions (Default Mode)
- **Zero forced presets**: Interviewers can author their own custom challenges directly from the home dashboard.
- **Custom Configuration**: Define challenge title, full markdown description, language, starter code template, and public/hidden test assertions.
- **Live In-Room Editing**: Hosts can update problem statements mid-session; edits are broadcast to candidates instantly via WebSockets (`problem-update`) with zero page reloads.

### 2. 💻 Monaco Editor & Collaborative Synchronizer
- Embedded `@monaco-editor/react` with sleek dark theme (`vs-dark`).
- Multi-language support: **JavaScript**, **Python**, **C++**, and **Java** with synced language switching across peers.
- Race-condition guard: Prevents circular cursor and character broadcast loops.
- **5-Second Debounced Auto-Save**: Persistent MongoDB cloud synchronization so no code is lost on disconnect.
- **1-Click Code Export**: Download `.js`, `.py`, `.cpp`, or `.java` files locally.

### 3. 📹 Real-Time WebRTC Peer-to-Peer Video & Audio Call
- **Native 1-on-1 WebRTC Calling**: Direct peer-to-peer media stream connection between interviewer and candidate.
- **Floating Controls**: Picture-in-Picture window with camera toggle, mic mute, and minimization pill to preserve full code editor view.

### 4. 🧪 Hidden Test-Case Verification Engine
- Execute solutions against arbitrary public and hidden test cases using sandboxed runtime containers (Piston API).
- Candidate-safe redaction: Hidden test inputs/outputs are masked in the candidate view while providing comprehensive pass/fail rates.
- Displays stdout, stderr, execution time (ms), and memory stats.

### 5. 🛡️ Anti-Cheat Telemetry
- **Burst Paste Detection**: Detects abnormal code injection (>50 characters within <50ms).
- **Host-Exclusive Integrity Timeline**: Alerts the interviewer in real time without distracting the candidate.

### 6. 📊 Interview Scorecard & Automated PDF Report
- Rate candidates across 5 core competencies (Problem Solving, Code Quality, System Design, Communication, Efficiency) with a 1-5 star matrix.
- Qualitative interviewer feedback and recommendation tags (*Strong Hire*, *Hire*, *Lean Hire*, *Reject*).
- **1-Click Branded PDF Export**: Generates a downloadable interview scorecard report via `jspdf` & `jspdf-autotable`.

---

## 📁 Project Architecture

```
DevSync/
├── client/                     # Vite + React + Tailwind CSS + Monaco Editor + Lucide + WebRTC
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header with profile dropdown & auth triggers
│   │   │   ├── AuthModal.jsx       # Clean login & register modal
│   │   │   ├── VideoCallModal.jsx  # Floating WebRTC video/audio component
│   │   │   ├── ScorecardModal.jsx  # Interview scoring & PDF report generator
│   │   │   └── ProtectedRoute.jsx  # Authentication route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT token & user session management
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Custom question authoring & workspace creation
│   │   │   ├── RoomPage.jsx        # Full collaborative workspace, terminal & test suite
│   │   │   ├── Dashboard.jsx       # Profile details & socket latency diagnostic
│   │   │   ├── LoginPage.jsx       # Standalone login
│   │   │   └── RegisterPage.jsx    # Standalone register
│   │   ├── services/
│   │   │   ├── api.js              # Axios API service (Auth, Rooms, Execution)
│   │   │   └── socket.js           # Socket.io client instance
│   │   ├── App.jsx                 # SPA routing
│   │   └── index.css               # Tailwind CSS and theme tokens (#0B0F19)
│   ├── vercel.json                 # Vercel SPA routing configuration
│   └── package.json
│
├── server/                     # Node.js + Express (ES Modules) + Mongoose + Socket.io
│   ├── config/
│   │   └── db.js                   # Resilient MongoDB Mongoose connection
│   ├── controllers/
│   │   ├── authController.js       # Register, login, getMe
│   │   ├── roomController.js       # Create room, fetch room, update problem, submit tests
│   │   └── executeController.js    # Remote code runner with rate-limiting
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT bearer token verification
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt pre-save hook
│   │   └── Room.js                 # Room schema with 24-hour MongoDB TTL cleanup
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── roomRoutes.js           # /api/rooms
│   │   └── executeRoutes.js        # /api/execute (rate-limited 15/min)
│   ├── socket/
│   │   └── index.js                # WebSockets + WebRTC signaling handlers
│   ├── server.js                   # Express + HTTP + Socket.io entry point
│   └── package.json
│
├── package.json
└── README.md
```

---

## 🛠️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone https://github.com/navsharma26/devsync.git
cd devsync
```

### 2. Configure Backend
```bash
cd server
npm install
```
Create a `.env` file inside `/server`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.1lbk3m1.mongodb.net/devsync
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```
Start the backend:
```bash
npm run dev
```

### 3. Configure Frontend
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🔒 Security Best Practices
- **Rate-Limiting**: Max 15 code executions per minute per user/IP to prevent compute abuse.
- **Isolated Execution**: Remote sandboxed compilation ensuring safe guest code execution.
- **Masked Data**: Candidate responses sanitize hidden test assertions and pass/fail metrics.
- **Environment Isolation**: Secrets, database credentials, and production tokens are strictly excluded from version control.

---

## 👨‍💻 Author
- **GitHub**: [@navsharma26](https://github.com/navsharma26)
