import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';
import { useAuth } from '../config/AuthContext';
import api from '../config/api';

export default function TeacherDashboard() {
    const { user, logout, role } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('home');
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>({ students: 0, exams: 0 });
    const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'home' || activeTab === 'profile') {
                const res = await api.get(`/auth/profile/${user?.uid}`);
                setProfile(res.data);
            }
            if (activeTab === 'registration' || activeTab === 'home') {
                const res = await api.get('/teacher/pending-enrollments');
                setPendingEnrollments(res.data);
            }
            if (activeTab === 'payment' || activeTab === 'home') {
                const res = await api.get('/teacher/pending-payments');
                setPendingPayments(res.data);
            }
        } catch (error) {
            console.error('Error fetching teacher data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEnrollment = async (id: string) => {
        try {
            await api.patch(`/teacher/verify-enrollment/${id}`);
            alert('Enrollment Verified!');
            fetchData();
        } catch (error) {
            alert('Verification failed');
        }
    };

    const handleVerifyPayment = async (id: string) => {
        try {
            await api.patch(`/teacher/verify-payment/${id}`);
            alert('Payment Verified! Course activated for student.');
            fetchData();
        } catch (error) {
            alert('Payment verification failed');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="teacher-dashboard">
            <aside className="teacher-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.png" alt="EduAssess" style={{ width: '40px' }} />
                    <h2>Tutor</h2>
                </div>
                <div className="teacher-user-info">
                    <span className="name">{profile?.full_name || user?.email}</span>
                    <span className="dept">{profile?.department_id}</span>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>🏠 Dashboard</li>
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Profile</li>
                    <li className={activeTab === 'registration' ? 'active' : ''} onClick={() => setActiveTab('registration')}>📝 Enrollments</li>
                    <li className={activeTab === 'payment' ? 'active' : ''} onClick={() => setActiveTab('payment')}>💳 Payments</li>
                    <li className={activeTab === 'exam' ? 'active' : ''} onClick={() => setActiveTab('exam')}>🧪 Exams</li>
                    <li className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>📊 Results</li>
                    <li style={{ marginTop: 'auto' }} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </aside>

            <main className="teacher-main">
                <header className="teacher-header">
                    <h1>{activeTab.toUpperCase()}</h1>
                    <div className="badge">{role?.toUpperCase()}</div>
                </header>

                <section className="dashboard-content">
                    {activeTab === 'home' && (
                        <div className="tab-home animate-fade-in">
                            <div className="dashboard-stats">
                                <div className="stat-card">
                                    <h3>Students</h3>
                                    <p className="stat-number">0</p>
                                </div>
                                <div className="stat-card urgent">
                                    <h3>Pending Enroll</h3>
                                    <p className="stat-number">{pendingEnrollments.length}</p>
                                </div>
                                <div className="stat-card urgent">
                                    <h3>Pending Paid</h3>
                                    <p className="stat-number">{pendingPayments.length}</p>
                                </div>
                            </div>
                            <div className="card">
                                <h3>Quick Actions</h3>
                                <button className="btn-next" onClick={() => setActiveTab('exam')}>Create New Exam</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'registration' && (
                        <div className="card glass animate-slide-up">
                            <h3>Pending Course Enrollments</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Course ID</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingEnrollments.map(e => (
                                        <tr key={e.id}>
                                            <td>{e.studentName}</td>
                                            <td>{e.courseId}</td>
                                            <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
                                            <td>
                                                <button onClick={() => handleVerifyEnrollment(e.id)} className="btn-verify">Approve</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pendingEnrollments.length === 0 && <p className="no-data">No pending enrollments.</p>}
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="card glass animate-slide-up">
                            <h3>Pending Payment Approvals</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Transaction ID</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingPayments.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.studentName}</td>
                                            <td>₹{p.amount}</td>
                                            <td>{p.transactionId}</td>
                                            <td>
                                                <button onClick={() => handleVerifyPayment(p.id)} className="btn-verify">Confirm Payment</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {pendingPayments.length === 0 && <p className="no-data">No pending payments.</p>}
                        </div>
                    )}

                    {activeTab === 'profile' && profile && (
                        <div className="card glass animate-fade-in">
                            <h3>Professional Profile</h3>
                            <table className="profile-table">
                                <tbody>
                                    <tr><td>Full Name</td><td>{profile.full_name}</td></tr>
                                    <tr><td>Email</td><td>{profile.email}</td></tr>
                                    <tr><td>Department</td><td>{profile.department_id}</td></tr>
                                    <tr><td>Specialization</td><td>{profile.specialization}</td></tr>
                                    <tr><td>Account Status</td><td className="success">{profile.status}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

