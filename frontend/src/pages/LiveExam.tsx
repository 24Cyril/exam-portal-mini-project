import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './LiveExam.css';
import api from '../config/api';
import { useAuth } from '../config/AuthContext';
export default function LiveExam() {
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
    }, []);

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
            navigate('/student');
        } catch (error) {
            alert('Submission failed');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="exam-loading">Preparing your examination environment...</div>;

    const q = questions[currentIdx];
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="live-exam-page">
            <header className="exam-header">
                <div className="exam-logo">EDU-ASSESS LIVE</div>
                <div className="exam-info">
                    <span>{user?.email}</span>
                    <div className="timer-pill" style={{ color: timeLeft < 300 ? '#ff4d4d' : 'inherit' }}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            <div className="exam-layout">
                <main className="exam-content">
                    <div className="question-card glass animate-slide-up">
                        <div className="q-meta">
                            <span className="q-number">Question {currentIdx + 1} of {questions.length}</span>
                            <button className={`btn-bookmark ${bookmarks.has(currentIdx) ? 'active' : ''}`} onClick={toggleBookmark}>
                                {bookmarks.has(currentIdx) ? '🔖 Bookmarked' : '📑 Bookmark'}
                            </button>
                        </div>
                        <h2 className="q-text">{q.question}</h2>
                        <div className="options-grid">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <div
                                    key={opt}
                                    className={`option-box ${responses[currentIdx + 1] === opt ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    <span className="opt-letter">{opt}</span>
                                    <span className="opt-val">{q[`option_${opt.toLowerCase()}`] || q[opt]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="exam-footer">
                        <button
                            className="btn-nav"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(prev => prev - 1)}
                        >← Previous</button>

                        {currentIdx === questions.length - 1 ? (
                            <button className="btn-finish" onClick={() => handleSubmit()} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Finish Exam'}
                            </button>
                        ) : (
                            <button className="btn-nav" onClick={() => setCurrentIdx(prev => prev + 1)}>Next Question →</button>
                        )}
                    </div>
                </main>

                <aside className="exam-sidebar glass">
                    <h3>Question Navigator</h3>
                    <div className="nav-grid">
                        {questions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`nav-item ${currentIdx === idx ? 'active' : ''} ${responses[idx + 1] ? 'answered' : ''} ${bookmarks.has(idx) ? 'bookmarked' : ''}`}
                                onClick={() => setCurrentIdx(idx)}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>
                    <div className="nav-legend">
                        <div className="leg-item"><span className="dot answered"></span> Answered</div>
                        <div className="leg-item"><span className="dot bookmarked"></span> Bookmarked</div>
                        <div className="leg-item"><span className="dot current"></span> Current</div>
                    </div>
                    <button className="btn-submit-sidebar" onClick={() => handleSubmit()} disabled={submitting}>Submit All</button>
                </aside>
            </div>
        </div>
    );
}
