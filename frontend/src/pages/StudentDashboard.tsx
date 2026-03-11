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
    const [results, setResults] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
const [paymentData, setPaymentData] = useState({
   courseId: '',
   amount: '',
   paymentType: 'Registration',
   transactionId: ''
});
    // Note Timer State
    const [timers, setTimers] = useState<{ [key: string]: { time: number, isRunning: boolean } }>({});
    const [intervalIds, setIntervalIds] = useState<{ [key: string]:number }>({});

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
            if (activeTab === 'home' || activeTab === 'main-exam' || activeTab === 'mock-exams' || activeTab === 'test-exams') {
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
            if (activeTab === 'home' || activeTab === 'results') {
                const res = await api.get('/student/my-results');
                setResults(res.data);
            }
            if (activeTab === 'performance') {
                const res = await api.get('/student/performance');
                setPerformance(res.data);
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

  const handleUnenroll = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to cancel your enrollment request?')) return;
    try {
        await api.delete(`/student/unenroll/${courseId}`);
        alert('Enrollment request cancelled');
        fetchData();
    } catch (error: any) {
        alert(error.response?.data?.error || 'Operation failed');
    }
};

    const calculateGrade = (score: number, total: number) => {
        const perc = (score / total) * 100;
        if (perc >= 90) return 'A+';
        if (perc >= 80) return 'A';
        if (perc >= 70) return 'B';
        if (perc >= 60) return 'C';
        if (perc >= 50) return 'D';
        return 'F';
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



    
   // Timer functions
const toggleTimer = (noteId: string) => {
    setTimers(prev => {
        const current = prev[noteId] || { time: 0, isRunning: false };
        const isRunning = !current.isRunning;

        if (isRunning) {
            const id = setInterval(() => {
                setTimers(t => ({
                    ...t,
                    [noteId]: { ...t[noteId], time: (t[noteId]?.time || 0) + 1 }
                }));
            }, 1000);
            setIntervalIds(ids => ({ ...ids, [noteId]: id }));
        } else {
            // Clear the interval properly
            setIntervalIds(ids => {
                if (ids[noteId]) {
                    clearInterval(ids[noteId]);
                }
                return ids;
            });
        }

        return { ...prev, [noteId]: { ...current, isRunning } };
    });
};




    const resetTimer = (noteId: string) => {
        if (intervalIds[noteId]) clearInterval(intervalIds[noteId]);
        setTimers(prev => ({ ...prev, [noteId]: { time: 0, isRunning: false } }));
    };



    const recordTime = async (noteId: string, courseId: string) => {
        const timeSpent = timers[noteId]?.time || 0;
        if (timeSpent === 0) return alert('No time recorded yet!');
        try {
            await api.post('/student/performance', {
                examId: `note_${noteId}`,
                noteReadTime: timeSpent,
                examDuration: 0,
                score: 0
            });
            alert(`Logged ${timeSpent}s reading time for note!`);
            fetchData();
        } catch (error) {
            alert('Failed to log performance');
        }
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
                                    <h3>Mock Exams</h3>
                                    <p className="stat-number">{exams.filter(ex => ex.exam_type === 'Mock').length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Main Exams</h3>
                                    <p className="stat-number">{exams.filter(ex => ex.exam_type === 'Main' || !ex.exam_type).length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Total Completed</h3>
                                    <p className="stat-number">{results.length}</p>
                                </div>
                            </div>
                            <div className="dashboard-notifications card">
                                <h3>Upcoming Exams</h3>
                                {exams.filter(ex => new Date(ex.exam_date) > new Date()).length > 0 ? (
                                    <ul>
                                        {exams.filter(ex => new Date(ex.exam_date) > new Date()).map(ex => (
                                            <li key={ex.id}>
                                                <strong>{ex.title}</strong> - {new Date(ex.exam_date).toLocaleDateString()}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-data">No upcoming exams scheduled.</p>
                                )}
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
                                            <tr><td>Age</td><td>{profile.age || '--'}</td></tr>
                                            <tr><td>Blood Group</td><td>{profile.blood_group || '--'}</td></tr>
                                            <tr><td>Nationality</td><td>{profile.nationality || '--'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="card glass">
                                    <h3>Contact Info</h3>
                                    <table className="profile-table">
                                        <tbody>
                                            <tr><td>Phone</td><td>{profile.contact_number || '--'}</td></tr>
                                            <tr><td>Emergency</td><td>{profile.emergency_contact || '--'}</td></tr>
                                            <tr><td>Address</td><td>{profile.address || '--'}</td></tr>
                                            <tr><td>City/State</td><td>{profile.city ? `${profile.city}, ${profile.state}` : '--'}</td></tr>
                                            <tr><td>Pincode</td><td>{profile.pincode || '--'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="card glass" style={{ gridColumn: 'span 2' }}>
                                    <h3>Academic Identity</h3>
                                    <table className="profile-table">
                                        <tbody>
                                            <tr><td>Institute</td><td>{profile.institute_name || '--'}</td></tr>
                                            <tr><td>Department</td><td>{profile.department_id || '--'}</td></tr>
                                            <tr><td>Roll Number</td><td>{profile.roll_number || '--'}</td></tr>
                                            <tr><td>Year / Sem</td><td>{profile.year_of_study || '--'} / {profile.semester || '--'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && isEditing && (
                        <div className="card glass animate-fade-in">
                            <h3 style={{ marginBottom: '20px' }}>Comprehensive Profile Update</h3>
                            <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
                                <div className="form-section">
                                    <h4>Basic Identity</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input type="text" value={editData.full_name || ''} onChange={e => setEditData({ ...editData, full_name: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label>Age</label>
                                            <input type="number" value={editData.age || ''} onChange={e => setEditData({ ...editData, age: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select value={editData.gender || ''} onChange={e => setEditData({ ...editData, gender: e.target.value })}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Date of Birth</label>
                                            <input type="date" value={editData.dob || ''} onChange={e => setEditData({ ...editData, dob: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Blood Group</label>
                                            <input type="text" placeholder="e.g. O+" value={editData.blood_group || ''} onChange={e => setEditData({ ...editData, blood_group: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Nationality</label>
                                            <input type="text" value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h4>Contact & Location</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Primary Phone</label>
                                            <input type="text" value={editData.contact_number || ''} onChange={e => setEditData({ ...editData, contact_number: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Emergency Contact</label>
                                            <input type="text" value={editData.emergency_contact || ''} onChange={e => setEditData({ ...editData, emergency_contact: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Full Address</label>
                                        <textarea value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} rows={2} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>City</label>
                                            <input type="text" value={editData.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>State</label>
                                            <input type="text" value={editData.state || ''} onChange={e => setEditData({ ...editData, state: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Pincode</label>
                                            <input type="text" value={editData.pincode || ''} onChange={e => setEditData({ ...editData, pincode: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Country</label>
                                            <input type="text" value={editData.country || ''} onChange={e => setEditData({ ...editData, country: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h4>Academic Profile</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Roll Number</label>
                                            <input type="text" value={editData.roll_number || ''} onChange={e => setEditData({ ...editData, roll_number: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Department</label>
                                            <select value={editData.department_id || ''} onChange={e => setEditData({ ...editData, department_id: e.target.value })}>
                                                <option value="">Select Department</option>
                                                <option value="Computer Science">Computer Science</option>
                                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                                <option value="Electrical Engineering">Electrical Engineering</option>
                                                <option value="Civil Engineering">Civil Engineering</option>
                                                <option value="Business Administration">Business Administration</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Semester</label>
                                            <input type="number" value={editData.semester || ''} onChange={e => setEditData({ ...editData, semester: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Institute Name</label>
                                            <input type="text" value={editData.institute_name || ''} onChange={e => setEditData({ ...editData, institute_name: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions" style={{ position: 'sticky', bottom: '-20px', background: 'white', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Discard</button>
                                    <button type="submit" className="btn-next">Apply Updates</button>
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
                                    <p className="dept-tag">{course.department}</p>
                                    <div className="fee">{course.fee && course.fee !== '0' ? `₹${course.fee}` : 'Free'}</div>
                                    <div className={`status-badge ${(course.enrollmentStatus || 'Not Enrolled').toLowerCase().replace(/ /g, '-')}`}>
                                        {course.enrollmentStatus || 'Not Enrolled'}
                                    </div>
                                  {course.enrollmentStatus && course.enrollmentStatus !== 'Not Enrolled' && (
    <button className="btn-unenroll" onClick={() => handleUnenroll(course.id)}>
        ❌ Unenroll
    </button>
)}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        {course.enrollmentStatus === 'Pending' && (
                                            <button className="btn-cancel" onClick={() => handleUnenroll(course.id)}>Cancel Request</button>
                                        )}
                                        {course.enrollmentStatus === 'Verified_Pending_Payment' && (
                                            <button className="btn-pay" onClick={() => { setPaymentData({ ...paymentData, courseId: course.id, amount: course.fee }); setShowPaymentModal(true); }}>💰 Pay Fee (₹{course.fee})</button>
                                        )}
                                        {(!course.enrollmentStatus || course.enrollmentStatus === 'Not Enrolled') && (
                                            <button className="btn-enroll" onClick={() => handleEnroll(course.id)}>Enroll Now</button>
                                        )}
                                    </div>
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
                                        <p className="code">Course: {n.courseName || n.courseId}</p>
                                        <p style={{ margin: '10px 0', fontSize: '0.9em' }}>{n.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                            <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                                            <a href={n.file_path} target="_blank" rel="noreferrer" className="btn-edit-sm" style={{ textDecoration: 'none', display: 'inline-block' }}>📄 View Material</a>
                                        </div>
                                        <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: '600' }}>Study Timer:</span>
                                                <span style={{ fontFamily: 'monospace', fontSize: '1.2em', color: 'var(--accent)' }}>
                                                    {Math.floor((timers[n.id]?.time || 0) / 60).toString().padStart(2, '0')}:
                                                    {((timers[n.id]?.time || 0) % 60).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => toggleTimer(n.id)} className={timers[n.id]?.isRunning ? "btn-cancel" : "btn-verify"} style={{ flex: 1, padding: '5px' }}>
                                                    {timers[n.id]?.isRunning ? '⏸ Pause' : '▶️ Start'}
                                                </button>
                                                <button onClick={() => resetTimer(n.id)} className="btn-delete-sm" style={{ padding: '5px 10px' }}>⏹</button>
                                                <button onClick={() => recordTime(n.id, n.courseId)} className="btn-next" style={{ padding: '5px 10px' }}>Log Time</button>
                                            </div>
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
                                            <tr key={p.id} onClick={() => setSelectedPayment(p)} style={{ cursor: 'pointer' }}>
                                                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                                <td>{p.courseName}</td>
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

                    {activeTab === 'results' && (
                        <div className="card glass animate-slide-up">
                            <h3>Examination Results</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Exam</th><th>Score</th><th>Grade</th><th>Percentage</th><th>Date</th></tr>
                                </thead>
                                <tbody>
                                    {results.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.examTitle}</td>
                                            <td>{r.score} / {r.total}</td>
                                            <td><span style={{ fontWeight: 700 }}>{calculateGrade(r.score, r.total)}</span></td>
                                            <td style={{ fontWeight: 700, color: (r.score / r.total) >= 0.4 ? 'var(--success)' : 'var(--danger)' }}>
                                                {((r.score / r.total) * 100).toFixed(1)}%
                                            </td>
                                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {results.length === 0 && <div className="no-data">No results available yet.</div>}
                        </div>
                    )}

                    {['main-exam', 'mock-exams', 'test-exams'].includes(activeTab) && (
                        <div className="card glass animate-slide-up">
                            <h3 style={{ textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</h3>
                            {exams.length > 0 ? (
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Title</th><th>Course</th><th>Date</th><th>Duration</th><th>Action</th></tr>
                                    </thead>
                                    <tbody>
                                        {exams.filter(ex => {
                                            if (activeTab === 'main-exam') return ex.exam_type === 'Main' || !ex.exam_type;
                                            if (activeTab === 'mock-exams') return ex.exam_type === 'Mock';
                                            if (activeTab === 'test-exams') return ex.exam_type === 'Test';
                                            return true;
                                        }).map(ex => (
                                            <tr key={ex.id}>
                                                <td>{ex.title || ex.name}</td>
                                                <td>{ex.courseName || ex.courseId}</td>
                                                <td>{new Date(ex.date || ex.exam_date).toLocaleDateString()}</td>
                                                <td>{ex.timeInMinutes || ex.time_limit} mins</td>
                                                <td>
                                                   <button
  className="btn-start"
  onClick={() => navigate(`/live-exam/${ex.id}`)}
>
  ▶ Start Exam
</button>
                                                     </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="no-data">No {activeTab.replace('-', ' ')} available at this time.</div>
                            )}
                        </div>
                    )}
                    {activeTab === 'performance' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="card glass animate-slide-up">
                                <h3>Academic Results</h3>
                                <div className="dashboard-stats" style={{ marginBottom: '20px' }}>
                                    <div className="stat-card">
                                        <h3>Total Tests Taken</h3>
                                        <p className="stat-number">{results.length}</p>
                                    </div>

                                    <div className="stat-card">
                                        <h3>Average Score</h3>
                                        <p className="stat-number" style={{ color: 'var(--primary)' }}>
                                            {results.length > 0
                                                ? (results.reduce((acc, r) => acc + (r.score / r.total), 0) / results.length * 100).toFixed(1)
                                                : '0'}%
                                        </p>
                                    </div>

                                    <div className="stat-card">
                                        <h3>Highest Score</h3>
                                        <p className="stat-number" style={{ color: 'var(--success)' }}>
                                            {results.length > 0
                                                ? Math.max(...results.map(r => (r.score / r.total) * 100)).toFixed(1)
                                                : '0'}%
                                        </p>
                                    </div>

                                    <div className="stat-card">
                                        <h3>Pass Rate</h3>
                                        <p className="stat-number">
                                            {results.length > 0
                                                ? ((results.filter(r => (r.score / r.total) >= 0.4).length / results.length) * 100).toFixed(1)
                                                : '0'}%
                                        </p>
                                    </div>
                                </div>

                                <h4>Recent Test History</h4>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Exam ID</th><th>Score</th><th>Result</th></tr>
                                    </thead>
                                    <tbody>
                                        {results.slice(0, 10).map(r => (
                                            <tr key={r.id}>
                                                <td>{r.examTitle}</td>
                                                <td>{r.score} / {r.total}</td>
                                                <td style={{ fontWeight: 700, color: (r.score / r.total) >= 0.4 ? 'var(--success)' : 'var(--danger)' }}>
                                                    {((r.score / r.total) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {results.length === 0 && <div className="no-data">Take some exams to see your performance!</div>}
                            </div>

                            <div className="card glass animate-slide-up">
                                <h3>Memorization Speed Analytics</h3>
                                <p style={{ marginBottom: '15px', color: 'var(--text-muted)' }}>Track the time spent studying your notes.</p>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Study Item (Note ID)</th><th>Time Logged (seconds)</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {performance.filter(p => (p.examId || '').startsWith('note_')).map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.examId.replace('note_', 'Note #')}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>{p.noteReadTime}s</td>
                                                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {performance.filter(p => (p.examId || '').startsWith('note_')).length === 0 && (
                                    <div className="no-data">No study time recorded yet. Use the timer on the Notes page!</div>
                                )}
                            </div>
                        </div>
                        
                    )}

                </section>
            </main>

            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass animate-zoom-in">
                        <h3>Secure Fee Payment</h3>
                        <p>You are paying for Course ID: <strong>{paymentData.courseId}</strong></p>
                        <div className="payment-amount">Amount Due: ₹{paymentData.amount}</div>

                        <form onSubmit={handlePay} className="edit-profile-form">
                            <div className="form-group">
                                <label>Payment Method</label>
                    <select value={paymentData.paymentType} onChange={e => setPaymentData({ ...paymentData, paymentType: e.target.value })}>                                    <option value="UPI">UPI / GPay / PhonePe</option>
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
            {selectedPayment && (
                <div className="modal-overlay">
                    <div className="modal-content animate-zoom-in" style={{ maxWidth: '500px', padding: '0', overflow: 'hidden' }}>
                        <div className="receipt-view" style={{ padding: '30px', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ margin: '0', color: 'var(--primary)' }}>Payment Receipt</h2>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.8em', color: 'var(--text-muted)' }}>ID: {selectedPayment.id}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0', fontWeight: '700' }}>Edu-Assess Portal</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.8em' }}>{new Date(selectedPayment.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {[
                                        ['Student', profile?.full_name],
                                        ['Email', profile?.email],
                                        ['Course ID', selectedPayment.courseId],
                                        ['Amount', `₹${selectedPayment.amount}`],
                                        ['Method', selectedPayment.paymentType],
                                        ['Transaction ID', selectedPayment.transactionId],
                                        ['Status', selectedPayment.status]
                                    ].map(([label, val]) => (
                                        <tr key={label} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '12px 0', fontWeight: '600', color: '#64748b', fontSize: '0.9em' }}>{label}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700' }}>{val}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                                <button className="btn-edit-sm" style={{ flex: 1 }} onClick={() => window.print()}>Print Receipt</button>
                                <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setSelectedPayment(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

