# Course Management & Grading System

A full-stack web application for managing courses, enrollments, assignment sign-up sheets, scheduling, and grading workflows. The system is designed to model real-world academic operations and demonstrates secure REST API design, role-based access control, and modern React architecture.

Originally implemented as a simple web app and later expanded significantly, this project includes advanced features and architectural improvements that go well beyond the initial version.

---

## 🚀 Features

### Core Features
- **Role-Based Access Control**: Admin, TA, and Student roles with dedicated dashboards and permissions
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing and enforced password updates
- **Course Management**: Full CRUD support for courses, sections, and academic terms
- **Member Management**: Student and TA enrollment with bulk CSV import
- **Sign-up Sheet System**: Assignment-based sign-up sheets with configurable time windows
- **Time Slot Scheduling**: Slot capacity limits, overlap detection, and scheduling constraints
- **Grading Interface**: Grade entry with bonuses, penalties, comments, and audit history

### Additional Features
- **Audit Trail**: Complete grading history with timestamps, editor tracking, and comment retention
- **Public Search**: Unauthenticated search for sign-up sheets by course code or name
- **Business Rule Enforcement**: Centralized validation for sign-up timing, slot limits, and deletion rules
- **Input Sanitization**: XSS protection and strict input validation
- **Protected Routes**: Middleware-based route protection with role-aware redirects
- **Real-Time UI Updates**: Live data synchronization across React components
- **CSV Processing**: Robust parsing, validation, and cleanup for bulk imports
- **Responsive UI**: Clean, role-specific dashboards with intuitive navigation

---

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router DOM
- Context API for global state management
- Vanilla JavaScript (initial implementation)

### Backend
- Node.js
- Express
- JSON Web Tokens (JWT)
- bcrypt
- Multer
- sanitize-html
- CORS

### Data Layer
- JSON-based persistence with filesystem operations

---

## 📋 Prerequisites
- Node.js 14+
- npm or yarn
- Modern web browser

---

## 🏃‍♂️ Getting Started

### Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### Run the Application

```bash
# Backend
cd server
npm start

# Frontend (new terminal)
cd client
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🏗️ Project Structure

```
project-root/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Role-specific dashboards and views
│   │   ├── contexts/       # Authentication state
│   │   ├── utils/          # API helpers
│   │   └── App.js
│   └── build/              # Production build
├── server/                 # Express backend
│   ├── data/               # JSON persistence
│   ├── uploads/            # Temporary CSV uploads
│   └── server.js
└── README.md
```

---

## 🐛 Challenges I Faced & How I Solved Them

### 1. Authentication & Role Enforcement
Designing middleware that enforces authentication and role permissions consistently across both frontend routes and backend endpoints.

### 2. Time Slot Conflict Detection
Implementing deterministic overlap detection logic to prevent invalid or conflicting scheduling windows.

### 3. Grade Change Audit History
Designing an append-only audit log that preserves historical grade changes while allowing future updates.

### 4. CSV Bulk Imports
Safely handling file uploads, parsing, validation, and cleanup without partial or inconsistent system state.

### 5. Input Validation & Security
Centralizing sanitization and validation logic to protect against malformed input and XSS vulnerabilities.

---

## 🎯 What I Learned
- Designing secure, role-aware REST APIs
- Managing authentication state in React
- Translating real-world workflow constraints into enforceable business logic
- Structuring scalable frontend and backend codebases
- Handling file uploads and data validation safely
- Building audit-safe systems with immutable history

---

## 🔧 Development Notes
- Uses file-based storage for simplicity
- Authentication tokens expire after 24 hours
- CSV uploads are deleted automatically after processing
- Backend serves frontend build in production
- All timestamps use ISO 8601 format

---

## 📝 Future Improvements
- Migrate to PostgreSQL or MongoDB
- Real-time updates via WebSockets
- Email notifications for sign-ups and grading
- Mobile-first UI refinements
- API documentation with Swagger
- Automated testing and CI

---

Built with ❤️ during my third year of Software Engineering
