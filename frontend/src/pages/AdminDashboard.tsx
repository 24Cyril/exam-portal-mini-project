import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { useAuth } from '../config/AuthContext';
import api from '../config/api';

export default function AdminDashboard() {
    const { user, logout, role } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newCourse, setNewCourse] = useState({ name: '', code: '', department: 'Computer Science', fee: '', duration: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'students') {
                const res = await api.get('/admin/users?role=student');
                setUsers(res.data);
            }
            if (activeTab === 'teachers') {
                const res = await api.get('/admin/users?role=teacher');
                setUsers(res.data);
            }
            if (activeTab === 'courses') {
                const res = await api.get('/admin/courses');
                setCourses(res.data);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/courses', newCourse);
            alert('Course created successfully!');
            setActiveTab('courses');
            fetchData();
        } catch (error) {
            alert('Failed to create course');
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/user/${uid}`);
            alert('User deleted');
            fetchData();
        } catch (error) {
            alert('Deletion failed');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.png" alt="EduAssess" style={{ width: '40px' }} />
                    <h2>Admin</h2>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>🏠 Home</li>
                    <li className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>🎓 Students</li>
                    <li className={activeTab === 'teachers' ? 'active' : ''} onClick={() => setActiveTab('teachers')}>👨‍🏫 Teachers</li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>📚 Courses</li>
                    <li style={{ marginTop: 'auto' }} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab.toUpperCase()}</h1>
                    <div className="badge">{role?.toUpperCase()}</div>
                </header>

                <section className="admin-content">
                    {activeTab === 'home' && (
                        <div className="tab-home animate-fade-in">
                            <div className="admin-grid">
                                <div className="admin-card">
                                    <h3>System Status</h3>
                                    <p>Welcome back, Admin. System is running healthy.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="tab-courses animate-slide-up">
                            <div className="admin-card glass">
                                <h3>📚 Manage Courses</h3>
                                <form className="course-form" onSubmit={handleCreateCourse}>
                                    <input type="text" placeholder="Course Name" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required />
                                    <input type="text" placeholder="Course Code" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required />
                                    <input type="number" placeholder="Fee (₹)" value={newCourse.fee} onChange={e => setNewCourse({ ...newCourse, fee: e.target.value })} required />
                                    <select value={newCourse.department} onChange={e => setNewCourse({ ...newCourse, department: e.target.value })}>
                                        <option>Computer Science</option>
                                        <option>Mechanical</option>
                                        <option>Electrical</option>
                                    </select>
                                    <button className="btn-next" type="submit">Create Course</button>
                                </form>

                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Code</th><th>Name</th><th>Dept</th><th>Fee</th></tr>
                                    </thead>
                                    <tbody>
                                        {courses.map(c => (
                                            <tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.department}</td><td>₹{c.fee}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'students' || activeTab === 'teachers') && (
                        <div className="tab-users animate-fade-in">
                            <div className="admin-card glass">
                                <h3>Manage {activeTab}</h3>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Name</th><th>Email</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.uid}>
                                                <td>{u.full_name}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <button onClick={() => handleDeleteUser(u.uid)} className="btn-delete">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && <p className="no-data">No {activeTab} found.</p>}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

