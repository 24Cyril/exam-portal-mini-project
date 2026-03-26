import { Link } from 'react-router-dom';
import './ResultPage.css';

export default function ResultPage() {
    // Mock result data - eventually this will come from your backend/API
    const mockResult = {
        studentId: '#ST-9921',
        studentName: 'Jane Smith',
        examName: 'Advanced Web Development Final',
        score: 85,
        totalQuestions: 100,
        grade: 'A',
        status: 'Pass',
        date: new Date().toLocaleDateString(),
    };

    return (
        <div className="result-page animate-fade-in">
            <div className="result-card glass">
                <div className={`result-badge ${mockResult.status === 'Pass' ? 'pass' : 'fail'}`}>
                    {mockResult.status === 'Pass' ? '🏆' : '❌'}
                </div>
                <h1 className="gradient-text">{mockResult.status === 'Pass' ? 'Congratulations!' : 'Keep Practicing!'}</h1>
                <p className="subtitle">You have successfully completed the {mockResult.examName}.</p>

                <div className="score-display">
                    <span className="score-value">{mockResult.score}</span>
                    <span className="score-total"> / {mockResult.totalQuestions}</span>
                </div>

                <div className="result-details">
                    <div className="detail-item">
                        <div className="detail-label">Grade</div>
                        <div className="detail-value">{mockResult.grade}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Status</div>
                        <div className="detail-value" style={{ color: 'var(--success)' }}>{mockResult.status}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Student ID</div>
                        <div className="detail-value">{mockResult.studentId}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Completed On</div>
                        <div className="detail-value">{mockResult.date}</div>
                    </div>
                </div>

                <div className="result-actions">
                    <button className="btn-download" onClick={() => window.print()}>🖨️ Print Result</button>
                    <Link to="/student" className="btn-home">Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}
