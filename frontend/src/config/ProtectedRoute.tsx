import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
    allowedRole?: 'student' | 'teacher' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
    const { user, role, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // If user is logged in but role doesn't match, redirect them to their correct dashboard
        if (role === 'student') return <Navigate to="/student" replace />;
        if (role === 'teacher') return <Navigate to="/teacher" replace />;
        if (role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
