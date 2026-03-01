import { useState } from 'react';
import './TeacherDashboard.css';

// Placeholder types – replace with real data from your API
interface TeacherInfo {
    full_name: string;
    department: string;
    email: string;
    phone: string;
    specialization: string;
    institute_name: string;
    profile_type: string;
}

const mockTeacher: TeacherInfo = {
    full_name: 'John Doe',
    department: 'Computer Science',
    email: 'john.doe@example.com',
    phone: '+1 555 1234',
    specialization: 'AI & ML',
    institute_name: 'University X',
    profile_type: 'teacher',
};

export default function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState<string>('home');
    const teacher = mockTeacher; // TODO: fetch real teacher data

    const openTab = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div className="teacher-dashboard">
            {/* Sidebar */}
            <aside className="teacher-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
                <h2>Teacher Panel</h2>
                <div className="teacher-user-info" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>{teacher.full_name}</span>
                    <span style={{ fontSize: '0.8em', opacity: 0.8 }}>{teacher.department}</span>
                </div>
                <ul>
                    <li id="tab-home" className={activeTab === 'home' ? 'active' : ''} onClick={() => openTab('home')}>🏠 Dashboard</li>
                    <li id="tab-profile" className={activeTab === 'profile' ? 'active' : ''} onClick={() => openTab('profile')}>👤 Profile</li>
                    <li id="tab-courses" className={activeTab === 'courses' ? 'active' : ''} onClick={() => openTab('courses')}>📚 Courses</li>
                    <li id="tab-students" className={activeTab === 'students' ? 'active' : ''} onClick={() => openTab('students')}>🎓 Students</li>
                    {/* Conditional admin tabs – you can control visibility via teacher.profile_type */}
                    {teacher.profile_type === 'admin' && (
                        <>
                            <li id="tab-teachers" className={activeTab === 'teachers' ? 'active' : ''} onClick={() => openTab('teachers')}>👨‍🏫 Teachers</li>
                            <li id="tab-departments" className={activeTab === 'departments' ? 'active' : ''} onClick={() => openTab('departments')}>🏢 Departments</li>
                        </>
                    )}
                    <li id="tab-registration" className={activeTab === 'registration' ? 'active' : ''} onClick={() => openTab('registration')}>📝 Registrations</li>
                    <li id="tab-exam" className={activeTab === 'exam' ? 'active' : ''} onClick={() => openTab('exam')}>🧪 Exams</li>
                    <li id="tab-payment" className={activeTab === 'payment' ? 'active' : ''} onClick={() => openTab('payment')}>💳 Payments</li>
                    <li id="tab-performance" className={activeTab === 'performance' ? 'active' : ''} onClick={() => openTab('performance')}>📊 Performance</li>
                </ul>
                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <a href="/logout" className="teacher-logout-btn">🚪 Logout</a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="teacher-main">
                <header className="teacher-header">
                    <h1 id="tab-title">
                        {activeTab === 'home' && 'Dashboard'}
                        {activeTab === 'profile' && 'Profile'}
                        {activeTab === 'courses' && 'Courses'}
                        {activeTab === 'students' && 'Students'}
                        {activeTab === 'teachers' && 'Teachers'}
                        {activeTab === 'departments' && 'Departments'}
                        {activeTab === 'registration' && 'Registrations'}
                        {activeTab === 'exam' && 'Exams'}
                        {activeTab === 'payment' && 'Payments'}
                        {activeTab === 'performance' && 'Performance'}
                    </h1>
                </header>
                <section id="tab-content" className="dashboard-content">
                    {/* Simple placeholder – replace with real components per tab */}
                    {activeTab === 'profile' && (
                        <div id="profile-content">
                            <div className="card">
                                <h3>My Profile</h3>
                                <table className="profile-table">
                                    <tbody>
                                        <tr><td>Full Name</td><td>{teacher.full_name}</td></tr>
                                        <tr><td>Email</td><td>{teacher.email}</td></tr>
                                        <tr><td>Phone</td><td>{teacher.phone}</td></tr>
                                        <tr><td>Department</td><td>{teacher.department}</td></tr>
                                        <tr><td>Specialization</td><td>{teacher.specialization}</td></tr>
                                        <tr><td>Institute</td><td>{teacher.institute_name}</td></tr>
                                        <tr><td>Role</td><td>{teacher.profile_type.toUpperCase()}</td></tr>
                                    </tbody>
                                </table>
                                <a href="/teacher/update" className="teacher-btn" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
                                    Update Profile
                                </a>
                            </div>
                        </div>
                    )}
                    {/* Add other tab contents similarly */}
                </section>
            </main>
        </div>
    );
}
