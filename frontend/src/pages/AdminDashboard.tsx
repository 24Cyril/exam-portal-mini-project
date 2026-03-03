import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { useAuth } from '../config/AuthContext';
import api from '../config/api';

export default function AdminDashboard() {
    const { user, logout, role } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [profile, setProfile] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});

    // Search, Sort, Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterDept, setFilterDept] = useState('All');

    // New Item Forms
    const [newCourse, setNewCourse] = useState({
        name: '',
        code: '',
        department: 'Computer Science',
        fee: '',
        duration: '',
        description: '',
        status: 'Active'
    });
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        department_id: 'Computer Science'
    });
    const [showAddForm, setShowAddForm] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const profileRes = await api.get(`/auth/profile/${user?.uid}`);
            setProfile(profileRes.data);
            setEditData(profileRes.data);

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
            if (activeTab === 'enrollments') {
                const res = await api.get('/admin/enrollments');
                setEnrollments(res.data);
            }
            if (activeTab === 'payments') {
                const res = await api.get('/admin/payments');
                setPayments(res.data);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter & Sort Logic
    const filteredUsers = users
        .filter(u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
            if (sortBy === 'email') return a.email.localeCompare(b.email);
            return 0;
        });

    const filteredCourses = courses
        .filter(c => (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase())) && (filterDept === 'All' || c.department === filterDept))
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'code') return a.code.localeCompare(b.code);
            return 0;
        });

    const filteredEnrollments = enrollments
        .filter(e => e.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || e.courseId.toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredPayments = payments
        .filter(p => p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) || p.courseId.toLowerCase().includes(searchTerm.toLowerCase()) || p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));

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

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/courses', newCourse);
            alert('Course created successfully!');
            setShowAddForm(false);
            fetchData();
        } catch (error) {
            alert('Failed to create course');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            alert('User created successfully!');
            setShowAddForm(false);
            fetchData();
        } catch (error) {
            alert('Failed to create user');
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

    const handleVerifyEnrollment = async (id: string, status: string) => {
        try {
            await api.patch(`/admin/enrollment/${id}`, { status });
            alert(`Enrollment ${status}`);
            fetchData();
        } catch (error) { alert('Action failed'); }
    };

    const handleVerifyPayment = async (id: string, status: string) => {
        try {
            await api.patch(`/admin/payment/${id}`, { status });
            alert(`Payment ${status}`);
            fetchData();
        } catch (error) { alert('Action failed'); }
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
                    <h2>Admin Panel</h2>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => { setActiveTab('home'); setIsEditing(false); setSearchTerm(''); setShowAddForm(false); }}>🏠 Home</li>
                    <li className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setSearchTerm(''); setShowAddForm(false); }}>🎓 Students</li>
                    <li className={activeTab === 'teachers' ? 'active' : ''} onClick={() => { setActiveTab('teachers'); setSearchTerm(''); setShowAddForm(false); }}>👨‍🏫 Teachers</li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => { setActiveTab('courses'); setSearchTerm(''); setShowAddForm(false); }}>📚 Courses</li>
                    <li className={activeTab === 'enrollments' ? 'active' : ''} onClick={() => { setActiveTab('enrollments'); setSearchTerm(''); setShowAddForm(false); }}>📝 Enrollments</li>
                    <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => { setActiveTab('payments'); setSearchTerm(''); setShowAddForm(false); }}>💸 Payments</li>
                    <li style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab.toUpperCase()}</h1>
                    <div className="badge">{role?.toUpperCase()}</div>
                </header>

                <section className="admin-content">
                    {/* Toolbar for Search, Sort, Filter */}
                    {activeTab !== 'home' && (
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
                                <option value="code">Sort by ID/Code</option>
                                <option value="email">Sort by Email</option>
                            </select>
                            {activeTab === 'courses' && (
                                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="toolbar-select">
                                    <option value="All">All Departments</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Mechanical">Mechanical</option>
                                    <option value="Electrical">Electrical</option>
                                </select>
                            )}
                            <button className="btn-next" onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? 'Cancel' : `+ Add ${activeTab.slice(0, -1)}`}</button>
                        </div>
                    )}

                    {activeTab === 'home' && !isEditing && (
                        <div className="tab-home animate-fade-in">
                            <div className="admin-grid">
                                <div className="admin-card profile-card glass">
                                    <h3>Administrator Profile</h3>
                                    <div className="profile-info-compact">
                                        <table className="profile-table">
                                            <tbody>
                                                <tr><td><strong>Name</strong></td><td>{profile?.full_name}</td></tr>
                                                <tr><td><strong>Email</strong></td><td>{profile?.email}</td></tr>
                                                <tr><td><strong>Institute</strong></td><td>{profile?.institute_name || '--'}</td></tr>
                                                <tr><td><strong>Role</strong></td><td>{profile?.role?.toUpperCase()}</td></tr>
                                            </tbody>
                                        </table>
                                        <button className="btn-edit-sm" style={{ marginTop: '15px' }} onClick={() => setIsEditing(true)}>✏️ Update Details</button>
                                    </div>
                                </div>
                                <div className="admin-card">
                                    <h3>System Snapshot</h3>
                                    <div className="snapshot-stats">
                                        <p>Database: 🟢 Operational</p>
                                        <p>Total Users: {users.length}</p>
                                        <p>Active Courses: {courses.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'home' && isEditing && (
                        <div className="admin-card glass animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <h3>Detailed Profile Update</h3>
                            <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
                                <div className="form-row">
                                    <div className="form-group"><label>Full Name</label><input type="text" value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} required /></div>
                                    <div className="form-group"><label>Contact Number</label><input type="text" value={editData.contact_number} onChange={e => setEditData({ ...editData, contact_number: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Date of Birth</label><input type="date" value={editData.dob} onChange={e => setEditData({ ...editData, dob: e.target.value })} /></div>
                                    <div className="form-group"><label>Gender</label>
                                        <select value={editData.gender} onChange={e => setEditData({ ...editData, gender: e.target.value })}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group"><label>Institute Name</label><input type="text" value={editData.institute_name} onChange={e => setEditData({ ...editData, institute_name: e.target.value })} /></div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn-next">Save profile</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="tab-courses animate-slide-up">
                            {showAddForm ? (
                                <div className="admin-card glass animate-fade-in" style={{ marginBottom: '20px' }}>
                                    <h3>Add New Detailed Course</h3>
                                    <form className="course-form-detailed" onSubmit={handleCreateCourse}>
                                        <div className="form-row">
                                            <div className="form-group"><label>Course Name</label><input type="text" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} required /></div>
                                            <div className="form-group"><label>Course Code</label><input type="text" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} required /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Fee (₹)</label><input type="number" value={newCourse.fee} onChange={e => setNewCourse({ ...newCourse, fee: e.target.value })} required /></div>
                                            <div className="form-group"><label>Duration</label><input type="text" placeholder="e.g. 6 months" value={newCourse.duration} onChange={e => setNewCourse({ ...newCourse, duration: e.target.value })} /></div>
                                        </div>
                                        <div className="form-group"><label>Course Description</label><textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} /></div>
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button className="btn-next" type="submit">Create Course</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="admin-card glass">
                                    <table className="admin-table">
                                        <thead>
                                            <tr><th>Code</th><th>Name</th><th>Dept</th><th>Fee</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredCourses.map(c => (
                                                <tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.department}</td><td>₹{c.fee}</td><td><span className="success">Active</span></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredCourses.length === 0 && <p className="no-data">No courses match your search.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {(activeTab === 'students' || activeTab === 'teachers') && (
                        <div className="tab-users animate-fade-in">
                            {showAddForm ? (
                                <div className="admin-card glass animate-fade-in">
                                    <h3>Create {activeTab.slice(0, -1)} Account</h3>
                                    <form className="edit-profile-form" onSubmit={handleCreateUser}>
                                        <div className="form-row">
                                            <div className="form-group"><label>Full Name</label><input type="text" required onChange={e => setNewUser({ ...newUser, full_name: e.target.value, role: activeTab.slice(0, -1) })} /></div>
                                            <div className="form-group"><label>Email</label><input type="email" required onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group"><label>Password</label><input type="password" required onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                                            <div className="form-group"><label>Department</label>
                                                <select onChange={e => setNewUser({ ...newUser, department_id: e.target.value })}>
                                                    <option>Computer Science</option>
                                                    <option>Mechanical</option>
                                                    <option>Electrical</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                                            <button className="btn-next" type="submit">Register {activeTab.slice(0, -1)}</button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="admin-card glass">
                                    <table className="admin-table">
                                        <thead>
                                            <tr><th>Name</th><th>Email</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u.uid}><td>{u.full_name}</td><td>{u.email}</td>
                                                    <td><button onClick={() => handleDeleteUser(u.uid)} className="btn-delete">Delete</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredUsers.length === 0 && <p className="no-data">No {activeTab} match your search.</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'enrollments' && (
                        <div className="tab-enrollments animate-fade-in">
                            <div className="admin-card glass">
                                <h3>Pending Enrollments</h3>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Student</th><th>Course</th><th>Status</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredEnrollments.map(e => (
                                            <tr key={e.id}>
                                                <td>{e.studentId}</td>
                                                <td>{e.courseId}</td>
                                                <td><span className={`badge ${e.status.toLowerCase().includes('active') ? 'success' : 'pending'}`}>{e.status}</span></td>
                                                <td>
                                                    {e.status === 'Pending' && (
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button onClick={() => handleVerifyEnrollment(e.id, 'Verified_Pending_Payment')} className="btn-edit-sm" style={{ background: '#10b981', color: 'white', border: 'none' }}>Verify</button>
                                                            <button onClick={() => handleVerifyEnrollment(e.id, 'Rejected')} className="btn-delete">Reject</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredEnrollments.length === 0 && <p className="no-data">No enrollment requests found.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="tab-payments animate-fade-in">
                            <div className="admin-card glass">
                                <h3>Payment Verification</h3>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>Student</th><th>Course</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map(p => (
                                            <tr key={p.id}>
                                                <td>{p.studentId}</td>
                                                <td>{p.courseId}</td>
                                                <td>₹{p.amount}</td>
                                                <td><span className={`badge ${p.status === 'Verified' ? 'success' : 'pending'}`}>{p.status}</span></td>
                                                <td>
                                                    {p.status === 'Pending_Approval' && (
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button onClick={() => handleVerifyPayment(p.id, 'Verified')} className="btn-edit-sm" style={{ background: '#10b981', color: 'white', border: 'none' }}>Verify</button>
                                                            <button onClick={() => handleVerifyPayment(p.id, 'Rejected')} className="btn-delete">Reject</button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredPayments.length === 0 && <p className="no-data">No payment records found.</p>}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

