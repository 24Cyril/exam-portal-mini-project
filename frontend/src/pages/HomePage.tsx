import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import './HomePage.css';

export default function HomePage() {
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [email, setEmail] = useState(''); // Changed from username to email for Firebase Auth
    const [password, setPassword] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState<'Light' | 'Dark'>('Light');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        console.log('Login attempt:', { email, role });

        try {
            // 1. Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Firebase Auth success:', user.uid);
            const token = await user.getIdToken();

            // Store token
            localStorage.setItem('token', token);

            // 2. Fetch profile from Firestore to verify role
            console.log('Fetching profile from Firestore...');
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                setError('User profile not found in database.');
                return;
            }

            const userProfile = userSnap.data();
            console.log('Firestore response:', userProfile);

            if (userProfile?.role?.toLowerCase() !== role.toLowerCase()) {
                console.warn('Role mismatch:', { dbRole: userProfile?.role, selectedRole: role });
                setError(`The selected role (${role}) does not match your registered role. Please log in as ${userProfile?.role || 'the correct role'}.`);
                // Consider logging out here if we don't want them in this state
                auth.signOut();
                return;
            }

            console.log('Login successful! Navigating to:', `/${userProfile.role}`);

            // Navigate based on role from Firestore
            if (userProfile.role.toLowerCase() === 'student') navigate('/student');
            else if (userProfile.role.toLowerCase() === 'teacher') navigate('/teacher');
            else if (userProfile.role.toLowerCase() === 'admin') navigate('/admin');
        } catch (error: any) {
            console.error('Login failed:', error);
            setError(error.message === 'Firebase: Error (auth/user-not-found).' ? 'Account not found. Please register.' : error.message);
        }
    };


    useEffect(() => {
        document.body.classList.toggle('dark-mode', theme === 'Dark');
    }, [theme]);

    return (
        <div className="home-page">
            <header className="top-notification">
                <p>📢 Notice: Platform update scheduled on Sunday (10:00 AM – 12:00 PM)</p>
            </header>

            <section className="urgent-bar">
                <marquee>⚠️ Important: Academic assessment window opens tomorrow at 9:00 AM.</marquee>
            </section>

            <main className="main-content">
                <section className="info-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                        <img src="/logo.png" alt="EduAssess" style={{ width: '80px', height: '80px' }} />
                        <h1 className="gradient-text">EduAssess</h1>
                    </div>
                    <p className="subtitle animate-fade-in">
                        A unified digital environment for learning, assessment, and academic growth.
                    </p>


                    <div className="feature-box">
                        <h3>🌐 About the Platform</h3>
                        <p>
                            EduAssess is designed to support institutions and learners through
                            structured academic workflows, continuous evaluation, and outcome-based
                            performance monitoring.
                        </p>
                    </div>

                    <div className="feature-box">
                        <h3>🎓 Academic Experience</h3>
                        <p>
                            From course enrollment to assessments and result analysis,
                            the platform ensures a smooth and transparent academic journey
                            for students, faculty, and administrators.
                        </p>
                    </div>

                    <div className="feature-box">
                        <h3>📊 Learning & Evaluation</h3>
                        <p>
                            Assessments are integrated with performance insights,
                            helping learners understand their progress and helping
                            institutions maintain academic standards.
                        </p>
                    </div>

                    <div className="feature-box">
                        <h3>❓ Support & Assistance</h3>
                        <p>
                            Need help navigating the platform or understanding evaluation outcomes?
                            Our academic support system ensures timely assistance and guidance.
                        </p>
                    </div>

                    <div className="feature-box">
                        <h3>📞 Contact</h3>
                        <p>Email: support@eduassess.in</p>
                        <p>Phone: +91 90000 00000</p>
                    </div>
                </section>

                <section className="login-section">
                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="login-tabs">
                            <button
                                type="button"
                                className={`tab ${role === 'student' ? 'active' : ''}`}
                                onClick={() => setRole('student')}
                            >
                                Learner Login
                            </button>
                            <button
                                type="button"
                                className={`tab ${role === 'teacher' ? 'active' : ''}`}
                                onClick={() => setRole('teacher')}
                            >
                                Tutor Login
                            </button>
                            <button
                                type="button"
                                className={`tab ${role === 'admin' ? 'active' : ''}`}
                                onClick={() => setRole('admin')}
                            >
                                Admin Login
                            </button>
                        </div>

                        {error && <p style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '14px' }}>{error}</p>}

                        <label>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button type="submit">Access Portal</button>
                    </form>

                    <Link to="/register" style={{ display: 'block', marginTop: '20px', textAlign: 'center' }}>
                        Create an Academic Account
                    </Link>
                </section>
            </main>

            <button
                className="settings-btn"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
                ⚙️
            </button>

            {!isSettingsOpen && (
                <aside className={`settings-panel ${isSettingsOpen ? '' : 'hidden'}`}>
                    <h3>Preferences</h3>
                    <label>Theme</label>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'Light' | 'Dark')}
                        style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                    >
                        <option value="Light">Light</option>
                        <option value="Dark">Dark</option>
                    </select>
                </aside>
            )}

            {/* Actual settings panel implementation (toggleable) */}
            {isSettingsOpen && (
                <aside className="settings-panel">
                    <h3>Preferences</h3>
                    <label>Theme</label>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'Light' | 'Dark')}
                        style={{ width: '100%', padding: '8px', marginTop: '10px' }}
                    >
                        <option value="Light">Light</option>
                        <option value="Dark">Dark</option>
                    </select>
                    <button
                        onClick={() => setIsSettingsOpen(false)}
                        style={{ marginTop: '15px', width: '100%', padding: '8px' }}
                    >
                        Close
                    </button>
                </aside>
            )}
        </div>
    );
}
