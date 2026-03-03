import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import './RegisterPage.css';

export default function RegisterPage() {
    const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
    const [formData, setFormData] = useState<any>({});
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            return setError('Passwords do not match');
        }

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Sync profile data to backend/Firestore
            await axios.post('http://localhost:5000/api/auth/sync-profile', {
                uid: user.uid,
                role,
                ...formData
            });

            alert('Account Created Successfully!');
            navigate('/');
        } catch (error: any) {
            console.error('Registration failed:', error.message);
            setError(error.message);
        }
    };


    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Create Your Account</h2>
                <p className="subtitle">Join the EduAssess Community</p>

                <form onSubmit={handleRegister} className="form-grid">
                    <div className="role-switch">
                        <label>
                            <input
                                type="radio"
                                name="role"
                                value="student"
                                checked={role === 'student'}
                                onChange={() => setRole('student')}
                            />
                            Learner
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="role"
                                value="teacher"
                                checked={role === 'teacher'}
                                onChange={() => setRole('teacher')}
                            />
                            Tutor
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="role"
                                value="admin"
                                checked={role === 'admin'}
                                onChange={() => setRole('admin')}
                            />
                            Administrator
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <input name="username" type="text" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input name="password" type="password" onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input name="confirm_password" type="password" onChange={handleChange} required />
                    </div>

                    {role === 'student' && (
                        <div className="form-section">
                            <h3>Student Details</h3>
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name</label><input name="s_full_name" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Age</label><input name="age" type="number" onChange={handleChange} /></div>
                                <div className="form-group"><label>Gender</label>
                                    <select name="gender" onChange={handleChange}>
                                        <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Phone</label><input name="phone" type="tel" onChange={handleChange} /></div>
                                <div className="form-group"><label>Branch/Course</label><input name="course" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Department</label><input name="department" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Institute Name</label><input name="institute_name" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Year of Study</label><input name="year_of_study" type="number" onChange={handleChange} /></div>
                                <div className="form-group"><label>Enrollment Date</label><input name="enrollment_date" type="date" onChange={handleChange} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Address</label><textarea name="address" onChange={handleChange}></textarea></div>
                            </div>
                        </div>
                    )}

                    {role === 'teacher' && (
                        <div className="form-section">
                            <h3>Tutor / Teacher Details</h3>
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name</label><input name="full_name" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Age</label><input name="tutor_age" type="number" onChange={handleChange} /></div>
                                <div className="form-group"><label>Gender</label>
                                    <select name="tutor_gender" onChange={handleChange}>
                                        <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Phone</label><input name="tutor_phone" type="tel" onChange={handleChange} /></div>
                                <div className="form-group"><label>Department</label><input name="department" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Specialization</label><input name="specialization" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Institute Name</label><input name="institute_name" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Employee ID</label><input name="employee_id" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Joining Date</label><input name="joining_date" type="date" onChange={handleChange} /></div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Address</label><textarea name="tutor_address" onChange={handleChange}></textarea></div>
                            </div>
                        </div>
                    )}

                    {role === 'admin' && (
                        <div className="form-section">
                            <h3>Admin Details</h3>
                            <div className="form-grid">
                                <div className="form-group"><label>Full Name</label><input name="a_full_name" type="text" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Date of Birth</label><input name="dob" type="date" onChange={handleChange} /></div>
                                <div className="form-group"><label>Gender</label>
                                    <select name="a_gender" onChange={handleChange}>
                                        <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Contact Number</label><input name="contact_number" type="tel" onChange={handleChange} required /></div>
                                <div className="form-group"><label>Institute Code</label><input name="institute_code" type="text" onChange={handleChange} required /></div>
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '20px', width: '100%' }}>
                        {error && <p style={{ color: 'var(--danger)', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
                        <button type="submit" className="register-btn">Create Account</button>
                    </div>

                </form>

                <p className="login-link">
                    Already registered? <Link to="/">Login</Link>
                </p>
            </div>
        </div>
    );
}
