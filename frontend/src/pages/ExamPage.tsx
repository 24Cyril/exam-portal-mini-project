import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ExamPage.css';
import api from '../config/api';
import { useAuth } from '../config/AuthContext';

export default function ExamPage() {
    const { examId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [questions, setQuestions] = useState<any[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [responses, setResponses] = useState<{ [key: string]: string }>({});
    const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const timerRef = useRef<any>(null);

    useEffect(() => {
        startExam();
        return () => clearInterval(timerRef.current);
    }, [examId]);

    const startExam = async () => {
        try {
            const res = await api.post(`/student/start-exam`, { examId });
            setQuestions(res.data.questions || []);
            setTimeLeft((res.data.timeInMinutes || 30) * 60);
            setLoading(false);

            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            alert('Failed to start exam');
            navigate('/student');
        }
    };

    const handleSelect = (option: string) => {
        const qNo = currentIdx + 1;
        setResponses(prev => ({ ...prev, [qNo]: option }));
    };

    const toggleBookmark = () => {
        const newBookmarks = new Set(bookmarks);
        if (newBookmarks.has(currentIdx)) {
            newBookmarks.delete(currentIdx);
        } else {
            newBookmarks.add(currentIdx);
        }
        setBookmarks(newBookmarks);
    };

    const handleSubmit = async (isAuto = false) => {
        if (!isAuto && !window.confirm('Are you sure you want to finish the exam?')) return;

        setSubmitting(true);
        clearInterval(timerRef.current);
        try {
            const res = await api.post('/student/submit-result', {
                examId,
                answers: responses
            });
            alert(`Exam Submitted! Your Score: ${res.data.score}/${res.data.total}`);
            navigate('/student/results');
        } catch (error) {
            alert('Submission failed');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Preparing your examination environment...</div>;

    const q = questions[currentIdx];
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="exam-page">
            <header className="exam-header">
                <div className="exam-logo" style={{ fontWeight: 800, fontSize: '1.2rem' }}>EDU-ASSESS LIVE</div>
                <div className="exam-info" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span>{user?.email}</span>
                    <div className="timer-pill" style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        color: timeLeft < 300 ? '#ff4d4d' : 'inherit'
                    }}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            <div className="exam-layout">
                <main className="exam-main">
                    <div className="question-card animate-slide-up">
                        <div className="q-header">
                            <span className="q-no">Question {currentIdx + 1} of {questions.length}</span>
                            <button className={`btn-bookmark ${bookmarks.has(currentIdx) ? 'active' : ''}`} onClick={toggleBookmark} style={{ background: 'transparent', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '5px' }}>
                                {bookmarks.has(currentIdx) ? '🔖 Bookmarked' : '📑 Bookmark'}
                            </button>
                        </div>
                        <h2 className="q-text" style={{ margin: '20px 0', fontSize: '1.5rem' }}>{q.question}</h2>
                        <div className="options-list">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <div
                                    key={opt}
                                    className={`option-item ${responses[currentIdx + 1] === opt ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                    style={{
                                        padding: '15px',
                                        border: '2px solid #f1f5f9',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        background: responses[currentIdx + 1] === opt ? 'var(--primary-light)' : 'white'
                                    }}
                                >
                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{opt}</span>
                                    <span>{q[`option_${opt.toLowerCase()}`] || q[opt]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="exam-footer">
                        <button
                            className="btn btn-prev"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(prev => prev - 1)}
                        >← Previous</button>

                        {currentIdx === questions.length - 1 ? (
                            <button className="btn-finish" onClick={() => handleSubmit()} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Finish Exam'}
                            </button>
                        ) : (
                            <button className="btn btn-next" onClick={() => setCurrentIdx(prev => prev + 1)}>Next Question →</button>
                        )}
                    </div>
                </main>

                <aside className="exam-sidebar">
                    <h3>Question Navigator</h3>
                    <div className="question-grid">
                        {questions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`q-num ${currentIdx === idx ? 'active' : ''} ${responses[idx + 1] ? 'answered' : ''} ${bookmarks.has(idx) ? 'bookmarked' : ''}`}
                                onClick={() => setCurrentIdx(idx)}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                    <button className="btn-finish" style={{ marginTop: 'auto' }} onClick={() => handleSubmit()} disabled={submitting}>Submit All</button>
                </aside>
            </div>
        </div>
    );
}
