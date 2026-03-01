import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ExamPage.css';
import api from '../config/api';

interface Question {
    text: string;
    options: string[];
}

export default function ExamPage() {
    const { examId } = useParams();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [bookmarks, setBookmarks] = useState<number[]>([]);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins default
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/student/my-exams`); // In a real app, fetch specific exam
                const exam = res.data.find((e: any) => e.id === examId);
                if (exam) {
                    setQuestions(exam.questions || []);
                    setTimeLeft((exam.timeInMinutes || 30) * 60);
                }
            } catch (error) {
                console.error('Failed to load exam:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (option: string) => {
        setAnswers({ ...answers, [currentQIndex + 1]: option });
    };

    const toggleBookmark = () => {
        if (bookmarks.includes(currentQIndex)) {
            setBookmarks(bookmarks.filter((i) => i !== currentQIndex));
        } else {
            setBookmarks([...bookmarks, currentQIndex]);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.post('/student/submit-result', {
                examId,
                answers
            });
            alert('Exam Submitted successfully! Your results have been recorded.');
            navigate('/student');
        } catch (error) {
            alert('Failed to submit exam. Please check your connection.');
        }
    };

    const handleFinish = () => {
        if (window.confirm('Are you sure you want to finish the exam?')) {
            handleSubmit();
        }
    };

    if (loading) return <div className="loading">Initializing Secure Environment...</div>;
    if (questions.length === 0) return <div className="no-data">No questions found for this exam.</div>;

    const currentQ = questions[currentQIndex];

    return (
        <div className="exam-page">
            <header className="exam-header">
                <div className="exam-title">SECURE ASSESSMENT PORTAL</div>
                <div style={{ fontVariantNumeric: 'tabular-nums' }}>Exam ID: {examId?.slice(0, 8)}</div>
            </header>

            <div className="exam-layout">
                <main className="exam-main">
                    <div className="question-card animate-fade-in">
                        <div className="q-header">
                            <span className="q-no">Question {currentQIndex + 1} of {questions.length}</span>
                        </div>
                        <div className="q-text">{currentQ.text}</div>
                        <div className="options-list">
                            {currentQ.options.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className={`option-item ${answers[currentQIndex + 1] === opt ? 'selected' : ''}`}
                                    onClick={() => handleOptionSelect(opt)}
                                >
                                    <div className={`option-bullet ${answers[currentQIndex + 1] === opt ? 'active' : ''}`}></div>
                                    <div className="option-label">{opt}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="exam-footer">
                        <button
                            className="btn btn-prev"
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(currentQIndex - 1)}
                        >
                            ← Previous
                        </button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-bookmark" onClick={toggleBookmark}>
                                {bookmarks.includes(currentQIndex) ? '🔖 Bookmarked' : '🔖 Bookmark'}
                            </button>
                            <button
                                className="btn btn-next"
                                disabled={currentQIndex === questions.length - 1}
                                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                            >
                                Next Question →
                            </button>
                        </div>
                    </div>
                </main>

                <aside className="exam-sidebar">
                    <div className="timer-box">
                        <div className="timer-label">Time Remaining</div>
                        <div className="timer-value">{formatTime(timeLeft)}</div>
                    </div>

                    <h4 style={{ marginBottom: '15px' }}>Question Navigator</h4>
                    <div className="question-grid">
                        {questions.map((_, idx) => (
                            <div
                                key={idx}
                                className={`q-num ${currentQIndex === idx ? 'active' : ''} ${answers[idx + 1] ? 'answered' : ''} ${bookmarks.includes(idx) ? 'bookmarked' : ''}`}
                                onClick={() => setCurrentQIndex(idx)}
                            >
                                {idx + 1}
                            </div>
                        ))}
                    </div>

                    <button className="btn-finish" onClick={handleFinish}>FINISH EXAM</button>
                </aside>
            </div>
        </div>
    );
}

