import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import { useAuth } from '../config/AuthContext';
import api from '../config/api';

export default function StudentDashboard() {
    const { user, role, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [profile, setProfile] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'profile' || activeTab === 'home') {
                // profile is same as user info in Firestore
                const res = await api.get(`/auth/profile/${user?.uid}`); // Need to create this route/backend
                setProfile(res.data);
            }
            if (activeTab === 'courses') {
                const res = await api.get('/student/available-courses');
                setCourses(res.data);
            }
            if (activeTab === 'main-exam') {
                const res = await api.get('/student/my-exams');
                setExams(res.data);
            }
            if (activeTab === 'payments') {
                const res = await api.get('/student/my-payments');
                setPayments(res.data);
            }
        } catch (error) {
            console.error('Error fetching student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId: string) => {
        try {
            await api.post('/student/enroll', { courseId });
            alert('Enrollment request submitted!');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Enrollment failed');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (loading && !profile && activeTab === 'home') return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="student-dashboard">
            <aside className="student-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.png" alt="EduAssess" style={{ width: '40px' }} />
                    <h2>Learner</h2>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>🏠 Home</li>
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Profile</li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>📚 Courses</li>
                    <li className={activeTab === 'main-exam' ? 'active' : ''} onClick={() => setActiveTab('main-exam')}>🧪 Active Exams</li>
                    <li className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>📊 Results</li>
                    <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>💳 Payments</li>
                    <li style={{ marginTop: 'auto' }} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </aside>

            <main className="student-main">
                <header className="student-header">
                    <h1>{activeTab.toUpperCase().replace('-', ' ')}</h1>
                    <div className="user-info">
                        <span>{user?.email}</span>
                        <div className="badge">{role?.toUpperCase()}</div>
                    </div>
                </header>

                <section className="student-content">
                    {activeTab === 'home' && (
                        <div className="tab-home animate-fade-in">
                            <div className="dashboard-stats">
                                <div className="stat-card">
                                    <h3>Courses</h3>
                                    <p className="stat-number">{courses.filter(c => c.enrollmentStatus === 'Approved').length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Exams</h3>
                                    <p className="stat-number">{exams.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Results</h3>
                                    <p className="stat-number">0</p>
                                </div>
                            </div>
                            <div className="card">
                                <h3>Notifications</h3>
                                <p style={{ color: 'var(--text-muted)' }}>No new notifications at this time.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && profile && (
                        <div className="tab-profile animate-slide-up">
                            <div className="profile-grid">
                                <div className="card glass">
                                    <img src={`https://ui-avatars.com/api/?name=${profile.full_name}&size=200&background=random`} alt="Avatar" style={{ borderRadius: '50%', marginBottom: '20px', display: 'block', margin: '0 auto' }} />
                                    <h3 style={{ textAlign: 'center' }}>{profile.full_name}</h3>
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{profile.course}</p>
                                </div>
                                <div className="card glass">
                                    <h3>Academic Identity</h3>
                                    <table className="profile-table">
                                        <tbody>
                                            <tr><td>Email</td><td>{profile.email}</td></tr>
                                            <tr><td>Department</td><td>{profile.department_id}</td></tr>
                                            <tr><td>Roll Number</td><td>{profile.roll_number || 'N/A'}</td></tr>
                                            <tr><td>Account Status</td><td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{profile.status}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="course-list grid">
                            {courses.map(course => (
                                <div key={course.id} className="card course-card animate-fade-in">
                                    <h4>{course.name}</h4>
                                    <p className="code">{course.code}</p>
                                    <div className="fee">₹{course.fee}</div>
                                    <div className={`status-badge ${course.enrollmentStatus.toLowerCase().replace(' ', '-')}`}>
                                        {course.enrollmentStatus}
                                    </div>
                                    {course.enrollmentStatus === 'Not Enrolled' && (
                                        <button onClick={() => handleEnroll(course.id)} className="btn-enroll">Enroll Now</button>
                                    )}
                                </div>
                            ))}
                            {courses.length === 0 && <div className="no-data">No courses available for your department.</div>}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="payment-history">
                            <div className="card glass">
                                <h3>Your Payment Records</h3>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Course</th>
                                            <th>Amount</th>
                                            <th>Transaction ID</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                <td>{p.courseId}</td>
                                                <td>₹{p.amount}</td>
                                                <td>{p.transactionId}</td>
                                                <td><span className={`badge ${p.status.toLowerCase()}`}>{p.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {payments.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No payments found.</p>}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

