import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [notes, setNotes] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ courseId: '', amount: 0, transactionId: '', method: 'UPI' });

    // Search & Sort States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');

    const navigate = useNavigate();

    // Reset search on tab change
    useEffect(() => {
        setSearchTerm('');
        fetchData();
    }, [activeTab]);

    // Filtering & Sorting Logic
    const filteredCourses = courses
        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : a.fee - b.fee);

    const filteredPayments = payments
        .filter(p => p.courseId.toLowerCase().includes(searchTerm.toLowerCase()) || p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => sortBy === 'date' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.amount - a.amount);

    const filteredExams = exams
        .filter(ex => ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || ex.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredNotes = notes
        .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/auth/profile/${user?.uid}`);
            setProfile(res.data);
            setEditData(res.data);

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
            if (activeTab === 'notes') {
                const res = await api.get('/student/notes');
                setNotes(res.data);
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

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/auth/profile/${user?.uid}`, editData);
            alert('Profile updated successfully!');
            setIsEditing(false);
            fetchData();
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/student/pay', paymentData);
            alert('Payment submitted for verification!');
            setShowPaymentModal(false);
            fetchData();
        } catch (error) { alert('Payment submission failed'); }
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
                    <h2>Student Panel</h2>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>🏠 Home</li>
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setIsEditing(false); }}>👤 Profile</li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>📚 Courses</li>
                    <li className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>📄 Notes</li>
                    <li className={activeTab === 'mock-exams' ? 'active' : ''} onClick={() => setActiveTab('mock-exams')}>🧠 Mock Exams</li>
                    <li className={activeTab === 'test-exams' ? 'active' : ''} onClick={() => setActiveTab('test-exams')}>📝 Test Exams</li>
                    <li className={activeTab === 'main-exam' ? 'active' : ''} onClick={() => setActiveTab('main-exam')}>📝 Main Exam</li>
                    <li className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>📊 Results</li>
                    <li className={activeTab === 'performance' ? 'active' : ''} onClick={() => setActiveTab('performance')}>📈 Performance</li>
                    <li className={activeTab === 'certificates' ? 'active' : ''} onClick={() => setActiveTab('certificates')}>🏆 Certificates</li>
                    <li className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>💬 Messages</li>
                    <li className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>🔔 Notifications</li>
                    <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>💳 Payments</li>
                    <li className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>⚙️ Settings</li>
                    <li style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={handleLogout}>🚪 Logout</li>
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
                    {/* Search/Sort Toolbar */}
                    {['courses', 'payments', 'main-exam'].includes(activeTab) && (
                        <div className="admin-toolbar glass animate-fade-in" style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', borderRadius: '12px' }}>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                            />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="toolbar-select">
                                <option value="name">Sort by Name/ID</option>
                                <option value="date">Sort by Recent</option>
                            </select>
                        </div>
                    )}
                    {activeTab === 'home' && (
                        <div className="tab-home animate-fade-in">
                            <div className="dashboard-stats">
                                <div className="stat-card">
                                    <h3>Courses Enrolled</h3>
                                    <p className="stat-number">{profile?.enrolled_count || courses.filter(c => c.enrollmentStatus === 'Enrolled_Active').length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Exams Completed</h3>
                                    <p className="stat-number">0</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Overall Grade</h3>
                                    <p className="stat-text">--</p>
                                </div>
                            </div>
                            <div className="dashboard-notifications card">
                                <h3>Upcoming Exams</h3>
                                <p className="no-data">No upcoming exams scheduled.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && profile && !isEditing && (
                        <div className="tab-profile animate-slide-up">
                            <div className="profile-header card glass">
                                <div className="profile-top">
                                    <img src={`https://ui-avatars.com/api/?name=${profile.full_name}&size=150&background=random`} alt="Avatar" className="profile-img" />
                                    <div className="profile-basic">
                                        <h2>{profile.full_name}</h2>
                                        <p>{profile.email}</p>
                                        <p className="badge-status">{profile.status}</p>
                                        <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit Profile</button>
                                    </div>
                                </div>
                            </div>
                            <div className="profile-grid">
                                <div className="card glass">
                                    <h3>Personal Details</h3>
                                    <table className="profile-table">
                                        <tbody>
                                            <tr><td>DOB</td><td>{profile.dob || '--'}</td></tr>
                                            <tr><td>Gender</td><td>{profile.gender || '--'}</td></tr>
                                            <tr><td>Address</td><td>{profile.address || '--'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="card glass">
                                    <h3>Academic Identity</h3>
                                    <table className="profile-table">
                                        <tbody>
                                            <tr><td>Department</td><td>{profile.department_id || '--'}</td></tr>
                                            <tr><td>Roll Number</td><td>{profile.roll_number || '--'}</td></tr>
                                            <tr><td>Year</td><td>{profile.year_of_study || '--'}</td></tr>
                                            <tr><td>Semester</td><td>{profile.semester || '--'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && isEditing && (
                        <div className="card glass animate-fade-in">
                            <h3>Edit Your Profile</h3>
                            <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input type="text" value={editData.contact_number} onChange={e => setEditData({ ...editData, contact_number: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Roll Number</label>
                                        <input type="text" value={editData.roll_number} onChange={e => setEditData({ ...editData, roll_number: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="date" value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} rows={3} />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn-next">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="course-list grid">
                            {filteredCourses.map(course => (
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
                                    {course.enrollmentStatus === 'Verified_Pending_Payment' && (
                                        <button onClick={() => { setPaymentData({ ...paymentData, courseId: course.id, amount: course.fee }); setShowPaymentModal(true); }} className="btn-enroll" style={{ background: 'var(--accent)' }}>💰 Pay Fee</button>
                                    )}
                                </div>
                            ))}
                            {courses.length === 0 && <div className="no-data">No courses available for your department.</div>}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="tab-notes animate-fade-in">
                            <div className="grid">
                                {filteredNotes.map(n => (
                                    <div key={n.id} className="card glass animate-slide-up">
                                        <h4>{n.title}</h4>
                                        <p className="code">Course: {n.courseId}</p>
                                        <p style={{ margin: '10px 0', fontSize: '0.9em' }}>{n.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                            <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                                            <a href={n.file_path} target="_blank" rel="noreferrer" className="btn-edit-sm" style={{ textDecoration: 'none', display: 'inline-block' }}>📄 View Material</a>
                                        </div>
                                    </div>
                                ))}
                                {filteredNotes.length === 0 && <div className="no-data">No study materials available for your courses.</div>}
                            </div>
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
                                            <th>ID</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map(p => (
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
                                {payments.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No payment history available.</p>}
                            </div>
                        </div>
                    )}

                    {['notes', 'mock-exams', 'test-exams', 'main-exam', 'results', 'performance', 'certificates', 'messages', 'notifications', 'settings'].includes(activeTab) && activeTab !== 'main-exam' && (
                        <div className="card glass animate-fade-in">
                            <h3 style={{ textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</h3>
                            <div className="no-data">
                                <p>This feature is being synchronized with the new system.</p>
                                <p style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Check back soon for updates.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'main-exam' && (
                        <div className="card glass animate-slide-up">
                            <h3>Scheduled Main Exams</h3>
                            {exams.length > 0 ? (
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Title</th><th>Course</th><th>Duration</th><th>Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredExams.map(ex => (
                                            <tr key={ex.id}>
                                                <td>{ex.title}</td>
                                                <td>{ex.courseId}</td>
                                                <td>{ex.timeInMinutes} min</td>
                                                <td><button className="btn-verify">Start Exam</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="no-data">No main exam scheduled currently.</div>
                            )}
                        </div>
                    )}
                </section>
            </main>

            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass animate-zoom-in">
                        <h3>Secure Fee Payment</h3>
                        <p>You are paying for Course ID: <strong>{paymentData.courseId}</strong></p>
                        <div className="payment-amount">Amount Duo: ₹{paymentData.amount}</div>

                        <form onSubmit={handlePay} className="edit-profile-form">
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select value={paymentData.method} onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}>
                                    <option value="UPI">UPI / GPay / PhonePe</option>
                                    <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                                    <option value="Card">Debit/Credit Card</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Transaction ID / UTR Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter 12-digit Ref No."
                                    value={paymentData.transactionId}
                                    onChange={e => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                />
                                <small>Please upload a screenshot if required by admin.</small>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn-next">Submit Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

