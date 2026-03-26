// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import teacherRoutes from './routes/teacher.js';
import studentRoutes from './routes/student.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase connection (handled in src/config/firebase.js)
import './config/firebase.js';


// Register routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
