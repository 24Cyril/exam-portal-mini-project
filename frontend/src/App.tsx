import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import LiveExam from './pages/LiveExam';
import { AuthProvider } from './config/AuthContext';
import ProtectedRoute from './config/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRole="teacher" />}>
            <Route path="/teacher/*" element={<TeacherDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route path="/student/*" element={<StudentDashboard />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/live-exam/:examId" element={<LiveExam />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


