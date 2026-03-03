import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';
import { useAuth } from '../config/AuthContext';
import api from '../config/api';

export default function TeacherDashboard() {
    const { user, logout, role } = useAuth();
    const [activeTab, setActiveTab] = useState<string>('home');
    const [profile, setProfile] = useState<any>(null);
    const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const navigate = useNavigate();

    // Search, Sort, Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterDept, setFilterDept] = useState('All');
    const [showAddForm, setShowAddForm] = useState(false);

    // Form Models matching HTML templates
    const [newExam, setNewExam] = useState({
        name: '', course_id: '', date: '', time_limit: '30',
        question_file: null as any, answer_file: null as any
    });
    const [newStudent, setNewStudent] = useState({
        username: '', password: '', full_name: '', email: '', phone: '',
        age: '0', gender: '', address: '', institute_name: '', course: '',
        department: '', year: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Filtering & Sorting Logic
    const filteredStudents = students
        .filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));

    const filteredCourses = courses
        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const filteredExams = exams
        .filter(ex => ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || ex.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredEnrollments = (pendingEnrollments || [])
        .filter(e => e.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || e.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredPayments = (pendingPayments || [])
        .filter(p => p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || p.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const fetchData = async () => {
        setLoading(true);
        try {
            const profileRes = await api.get(`/auth/profile/${user?.uid}`);
            setProfile(profileRes.data);
            setEditData(profileRes.data);

            if (activeTab === 'home' || activeTab === 'registration') {
                const res = await api.get('/teacher/pending-enrollments');
                setPendingEnrollments(res.data);
            }
            if (activeTab === 'home' || activeTab === 'payment') {
                const res = await api.get('/teacher/pending-payments');
                setPendingPayments(res.data);
            }
            if (activeTab === 'courses') {
                const res = await api.get('/admin/courses');
                setCourses(res.data);
            }
            if (activeTab === 'students') {
                const res = await api.get('/admin/users?role=student');
                setStudents(res.data);
            }
            if (activeTab === 'exam') {
                const res = await api.get('/teacher/exams'); // Assuming this exists or falls back to all
                setExams(res.data);
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
            alert('Payment Verified!');
            fetchData();
        } catch (error) {
            alert('Payment verification failed');
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/auth/profile/${user?.uid}`, editData);
            alert('Profile updated!');
            setIsEditing(false);
            fetchData();
        } catch (error) {
            alert('Update failed');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!window.confirm('Delete this course?')) return;
        try {
            await api.delete(`/admin/course/${id}`);
            fetchData();
        } catch (error) { alert('Delete failed'); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleAddExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/teacher/exams', newExam);
            alert('Exam Published!');
            setShowAddForm(false);
            fetchData();
        } catch (error) { alert('Exam publication failed'); }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Mapping newStudent state to API payload
            await api.post('/admin/users', { ...newStudent, role: 'student' });
            alert('Student Registered!');
            setShowAddForm(false);
            fetchData();
        } catch (error) { alert('Registration failed'); }
    };

    // Filter Logic
    const filteredExams = exams
        .filter(ex => ex.title?.toLowerCase().includes(searchTerm.toLowerCase()) || ex.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return (a.title || a.name || '').localeCompare(b.title || b.name || '');
            return (a.date || '').localeCompare(b.date || '');
        });

    const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredCourses = courses.filter(c => (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase())) && (filterDept === 'All' || c.department === filterDept));

    return (
        <div className="teacher-dashboard">
            <aside className="teacher-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.png" alt="EduAssess" style={{ width: '40px' }} />
                    <h2>Tutor Panel</h2>
                </div>
                <div className="teacher-user-info">
                    <span className="name">{profile?.full_name || 'Loading...'}</span>
                    <span className="dept">{profile?.department_id || 'Department'}</span>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => { setActiveTab('home'); setSearchTerm(''); setShowAddForm(false); }}>🏠 Dashboard</li>
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setIsEditing(false); setSearchTerm(''); setShowAddForm(false); }}>👤 Profile</li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => { setActiveTab('courses'); setSearchTerm(''); setShowAddForm(false); }}>📚 Courses</li>
                    <li className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setSearchTerm(''); setShowAddForm(false); }}>🎓 Students</li>
                    {role === 'admin' && <li className={activeTab === 'teachers' ? 'active' : ''} onClick={() => { setActiveTab('teachers'); setSearchTerm(''); setShowAddForm(false); }}>👨‍🏫 Teachers</li>}
                    <li className={activeTab === 'registration' ? 'active' : ''} onClick={() => { setActiveTab('registration'); setSearchTerm(''); setShowAddForm(false); }}>📝 Enrollments</li>
                    <li className={activeTab === 'exam' ? 'active' : ''} onClick={() => { setActiveTab('exam'); setSearchTerm(''); setShowAddForm(false); }}>🧪 Exams</li>
                    <li className={activeTab === 'payment' ? 'active' : ''} onClick={() => { setActiveTab('payment'); setSearchTerm(''); setShowAddForm(false); }}>💳 Payments</li>
                    <li className={activeTab === 'performance' ? 'active' : ''} onClick={() => { setActiveTab('performance'); setSearchTerm(''); setShowAddForm(false); }}>📊 Performance</li>
                    <li style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </aside>

            <main className="teacher-main">
                <header className="teacher-header">
                    <h1>{activeTab.toUpperCase()}</h1>
                    <div className="user-info-header">
                        <span>{user?.email}</span>
                        <div className="badge">{role?.toUpperCase()}</div>
                    </div>
                </header>

                <section className="dashboard-content">
                    {/* Search/Sort Toolbar */}
                    {['courses', 'students', 'exam'].includes(activeTab) && !showAddForm && (
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
                                <option value="name">Sort by Name</option>
                                <option value="date">Sort by Date</option>
                            </select>
                            <button className="btn-next" style={{ padding: '8px 16px', height: '40px' }} onClick={() => setShowAddForm(true)}>+ Add {activeTab === 'exam' ? 'Exam' : activeTab.slice(0, -1)}</button>
                        </div>
                    )}
                    {activeTab === 'home' && (
                        <div className="tab-home animate-fade-in">
                            <div className="dashboard-stats">
                                <div className="stat-card"><h3>Total Students</h3><p className="stat-number">{students.length}</p></div>
                                <div className="stat-card urgent"><h3>Pending Enroll</h3><p className="stat-number">{pendingEnrollments.length}</p></div>
                                <div className="stat-card urgent"><h3>Pending Paid</h3><p className="stat-number">{pendingPayments.length}</p></div>
                            </div>
                            <div className="card glass">
                                <h3>Quick Management</h3>
                                <div className="quick-actions">
                                    <button className="teacher-btn" onClick={() => setActiveTab('courses')}>Manage Courses</button>
                                    <button className="teacher-btn" onClick={() => setActiveTab('exam')}>Scheduled Exams</button>
                                    <button className="teacher-btn" onClick={() => setActiveTab('students')}>View Student List</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && profile && !isEditing && (
                        <div className="card glass animate-slide-up">
                            <div className="profile-details-view">
                                <h3>Professional Identity</h3>
                                <table className="profile-table">
                                    <tbody>
                                        <tr><td>Full Name</td><td>{profile.full_name}</td></tr>
                                        <tr><td>Email</td><td>{profile.email}</td></tr>
                                        <tr><td>Department</td><td>{profile.department_id}</td></tr>
                                        <tr><td>Specialization</td><td>{profile.specialization || '--'}</td></tr>
                                        <tr><td>Employee ID</td><td>{profile.employee_id || '--'}</td></tr>
                                        <tr><td>Account Status</td><td className="success">{profile.status}</td></tr>
                                    </tbody>
                                </table>
                                <button className="btn-verify" style={{ marginTop: '20px' }} onClick={() => setIsEditing(true)}>Update Profile</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && isEditing && (
                        <div className="card glass animate-fade-in">
                            <h3>Update Profile</h3>
                            <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
                                <div className="form-group"><label>Full Name</label><input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} required /></div>
                                <div className="form-group"><label>Specialization</label><input type="text" value={editData.specialization} onChange={e => setEditData({ ...editData, specialization: e.target.value })} /></div>
                                <div className="form-group"><label>Joining Date</label><input type="date" value={editData.joining_date} onChange={e => setEditData({ ...editData, joining_date: e.target.value })} /></div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn-next">Save Profile</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="card glass animate-slide-up">
                            {showAddForm ? (
                                <div className="animate-fade-in">
                                    <h3>Add Detailed Course</h3>
                                    <form className="edit-profile-form">
                                        <div className="form-row">
                                            <div className="form-group"><label>Course Name</label><input type="text" required /></div>
                                            <div className="form-group"><label>Course Code</label><input type="text" required /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Fee (₹)</label><input type="number" required /></div>
                                            <div className="form-group"><label>Duration</label><input type="text" placeholder="e.g. 6 months" /></div>
                                        </div>
                                        <div className="form-group"><label>Description</label><textarea rows={3} /></div>
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button type="submit" className="btn-next">Create Course</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    <h3>Managed Courses</h3>
                                    <table className="admin-table">
                                        <thead><tr><th>Code</th><th>Name</th><th>Fee</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredCourses.map(c => (
                                                <tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>₹{c.fee}</td>
                                                    <td>
                                                        <button className="btn-edit-sm">Edit</button>
                                                        <button className="btn-delete-sm" onClick={() => handleDeleteCourse(c.id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="card glass animate-slide-up">
                            {showAddForm ? (
                                <div className="animate-fade-in">
                                    <h3>🎓 Register New Student</h3>
                                    <form className="edit-profile-form" onSubmit={handleAddStudent}>
                                        <div className="form-row">
                                            <div className="form-group"><label>Full Name</label><input type="text" required value={newStudent.full_name} onChange={e => setNewStudent({ ...newStudent, full_name: e.target.value })} /></div>
                                            <div className="form-group"><label>Email</label><input type="email" required value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Phone</label><input type="tel" required value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} /></div>
                                            <div className="form-group"><label>Gender</label>
                                                <select value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })}>
                                                    <option>Select</option><option>Male</option><option>Female</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Course</label><input type="text" required value={newStudent.course} onChange={e => setNewStudent({ ...newStudent, course: e.target.value })} /></div>
                                            <div className="form-group"><label>Year</label>
                                                <select value={newStudent.year} onChange={e => setNewStudent({ ...newStudent, year: e.target.value })}>
                                                    <option value="1">1st Year</option><option value="2">2nd Year</option>
                                                    <option value="3">3rd Year</option><option value="4">4th Year</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group"><label>Address</label><textarea value={newStudent.address} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} /></div>
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button type="submit" className="btn-next">Add Student</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    <h3>Student Directory</h3>
                                    <table className="admin-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Roll No</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredStudents.map(s => (
                                                <tr key={s.uid}><td>{s.full_name}</td><td>{s.email}</td><td>{s.roll_number || 'N/A'}</td>
                                                    <td>
                                                        <button className="btn-edit-sm">View</button>
                                                        <button className="btn-delete-sm">Rem</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'exam' && (
                        <div className="card glass animate-slide-up">
                            {showAddForm ? (
                                <div className="animate-fade-in">
                                    <h3>🧪 Schedule New Exam</h3>
                                    <form className="edit-profile-form" onSubmit={handleAddExam}>
                                        <div className="form-row">
                                            <div className="form-group"><label>Exam Name</label><input type="text" required onChange={e => setNewExam({ ...newExam, name: e.target.value })} /></div>
                                            <div className="form-group"><label>Course</label>
                                                <select required onChange={e => setNewExam({ ...newExam, course_id: e.target.value })}>
                                                    <option value="">Select Course</option>
                                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Date</label><input type="date" required onChange={e => setNewExam({ ...newExam, date: e.target.value })} /></div>
                                            <div className="form-group"><label>Time Limit (Min)</label><input type="number" defaultValue="30" onChange={e => setNewExam({ ...newExam, time_limit: e.target.value })} /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Question Paper</label><input type="file" /></div>
                                            <div className="form-group"><label>Answer Key</label><input type="file" /></div>
                                        </div>
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button type="submit" className="btn-next">Publish Exam</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    <h3>Examination Schedule</h3>
                                    <table className="admin-table">
                                        <thead><tr><th>Title</th><th>Course</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredExams.map(ex => (
                                                <tr key={ex.id}><td>{ex.title || ex.name}</td><td>{ex.courseId || ex.course_id}</td><td>{ex.timeInMinutes || ex.time_limit}m</td><td>{ex.status || 'Active'}</td>
                                                    <td><button className="btn-edit-sm">Edit</button><button className="btn-delete-sm">Del</button></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}

                    {['teachers', 'departments', 'performance'].includes(activeTab) && (
                        <div className="card glass animate-fade-in">
                            <h3 style={{ textTransform: 'capitalize' }}>{activeTab} Management</h3>
                            <div className="no-data"><p>System module synchronization in progress.</p></div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

