---
description: Migrate Flask exam portal to React + Node.js (Express)
---

# Migration Workflow

This workflow outlines the step‑by‑step process to transform the existing Python/Flask exam‑portal‑mini‑project into a modern MERN‑style stack using **React** for the frontend and **Node.js/Express** for the backend.

## Prerequisites
- **Node.js** (v20 or later) and **npm** installed.
- **MongoDB** instance (local or Atlas) – you can also keep SQLite for a quick prototype, but MongoDB is recommended for a true MERN stack.
- Basic familiarity with React, Express, and REST APIs.
- Ensure the current project builds and its tests pass before starting the migration.

## Overview of Steps
1. **Analyze Existing Flask Application**
   - Identify all routes, view functions, and template files.
   - List static assets (CSS, JS, images) used by the templates.
   - Document the data models defined in `admin.py`, `teacher.py`, `student.py`, and the SQL schema (`db.sql`).
2. **Set Up Backend (Node.js + Express)**
   - Initialize a new Node.js project (`npm init -y`).
   - Install essential packages:
     ```
     npm install express mongoose cors dotenv bcryptjs jsonwebtoken
     ```
   - Create folder structure:
     - `backend/`
       - `src/`
         - `controllers/`
         - `models/`
         - `routes/`
         - `middlewares/`
         - `config/`
         - `app.js`
   - Translate each Flask route into an Express route.
   - Convert SQL models to Mongoose schemas (e.g., `User`, `Exam`, `Result`).
   - Implement authentication (JWT) mirroring the Flask login system.
   - Add CORS middleware to allow the React frontend to call the API.
3. **Set Up Frontend (React)**
   - Use Vite to bootstrap a React project for fast dev experience:
     ```
     npm create vite@latest frontend -- --template react
     cd frontend
     npm install
     ```
   - Install UI libraries and utilities (optional but recommended for a premium look):
     ```
     npm install @mui/material @emotion/react @emotion/styled axios react-router-dom
     ```
   - Create a component hierarchy that mirrors the original Flask templates:
     - `TeacherDashboard.jsx`
     - `StudentDashboard.jsx`
     - `AdminPanel.jsx`
     - Shared components: `Header`, `Footer`, `ExamCard`, `LoginForm`, etc.
   - Replace Jinja2 placeholders (`{{ variable }}`) with React state/props.
   - Use **Axios** to call the Express API endpoints.
4. **Migrate Static Assets & Styles**
   - Move CSS files from `app/static/` (or wherever they reside) into `frontend/src/styles/`.
   - Convert any inline CSS or legacy styles to **CSS Modules** or **styled‑components** for a modern, scoped approach.
   - Add a design system (e.g., a dark mode, glassmorphism, smooth gradients) to satisfy the premium UI requirement.
5. **Database Migration**
   - Export existing SQLite data (if any) to JSON.
   - Write a one‑off script (`scripts/migrate_sqlite_to_mongo.js`) that reads the JSON and inserts documents into MongoDB using the Mongoose models.
   - Update the backend config (`.env`) with MongoDB connection string.
6. **Testing & Validation**
   - Write unit tests for Express routes using **Jest** and **Supertest**.
   - Write component tests for React using **React Testing Library**.
   - Run end‑to‑end tests with **Cypress** to ensure the UI behaves like the original Flask app.
7. **Run & Debug**
   - Start backend: `npm run dev` (using nodemon) in `backend/`.
   - Start frontend: `npm run dev` in `frontend/`.
   - Verify all pages render correctly and API calls succeed.
8. **Deployment (Optional)**
   - Containerize with Docker: separate containers for backend, frontend, and MongoDB.
   - Deploy to a cloud provider (e.g., Render, Railway, or AWS Elastic Beanstalk).

## Detailed Step‑by‑Step Commands

```text
// 1. Clone the repo (if not already) and navigate to project root
cd c:\Users\anna\projects\exam-portal-mini-project

// 2. Create backend folder and init Node project
mkdir backend && cd backend
npm init -y
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install -D nodemon

// 3. Add a start script in package.json
# Edit package.json to include:
# "scripts": { "dev": "nodemon src/app.js" }

// 4. Scaffold backend file structure (you can run these commands or create manually)
mkdir -p src/{controllers,models,routes,middlewares,config}

// 5. Create a basic Express server (src/app.js)
# (See template below)

// 6. Return to project root and bootstrap React frontend with Vite
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install @mui/material @emotion/react @emotion/styled axios react-router-dom

// 7. Start both dev servers (in separate terminals)
# Backend
cd ..\backend && npm run dev
# Frontend
cd ..\frontend && npm run dev
```

## Example Files (Copy‑Paste Templates)

### backend/src/app.js
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import teacherRoutes from './routes/teacher.js';
import studentRoutes from './routes/student.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### backend/src/models/User.js (Mongoose schema example)
```javascript
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  // Add other fields as needed (e.g., email, createdAt)
});

export default model('User', userSchema);
```

### frontend/src/App.jsx (React Router skeleton)
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
```

## Next Steps for You
1. **Run the workflow** – follow the commands above to scaffold the backend and frontend.
2. **Map each Flask view** – open `teacher.py`, `student.py`, `admin.py` and copy the logic into the corresponding Express controllers.
3. **Convert templates** – for each HTML file (`teacher.html`, `student.html`, `admin.html`), create a React component and replace Jinja placeholders with React state.
4. **Test** – ensure the new API returns the same JSON shape the React app expects.
5. **Iterate** – gradually replace old Flask routes with the new API until the Flask app can be retired.

If you need any of the template files, controller skeletons, or further assistance with a specific part (e.g., authentication, database migration), just let me know and I’ll generate the exact code for you.

---
*This workflow is designed to give you a clear, premium‑quality migration path while keeping the UI modern and visually appealing.*
