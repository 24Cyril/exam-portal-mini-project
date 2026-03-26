let attemptId = null;
let currentIdx = 0;
let questions = [];
let responses = {}; // {q_no: selectedOption}
let bookmarks = new Set();
let timerInterval = null;
let timeLeft = 0;

// ===============================
// CORE ENGINE
// ===============================

async function startExam() {
    try {
        const response = await fetch(`/api/exam/${EXAM_ID}/start`, { method: 'POST' });
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            window.location.href = '/student';
            return;
        }

        attemptId = data.attempt_id;
        questions = data.questions || [];
        timeLeft = (data.time_limit || 30) * 60;

        // Initialize UI
        document.getElementById('exam-loading').classList.add('hidden');
        document.getElementById('question-viewer').classList.remove('hidden');
        document.getElementById('exam-controls').classList.remove('hidden');

        initQuestionGrid();
        renderQuestion(0);
        runTimer();

    } catch (err) {
        console.error("Exam start error:", err);
        alert("Unable to start exam. Check connection.");
    }
}

function initQuestionGrid() {
    const grid = document.getElementById('question-grid');
    grid.innerHTML = questions.map((q, idx) => `
        <div class="q-num" id="nav-q-${idx}" onclick="renderQuestion(${idx})">${idx + 1}</div>
    `).join('');
}

function renderQuestion(idx) {
    if (idx < 0 || idx >= questions.length) return;

    // Update active class in grid
    document.querySelectorAll('.q-num').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-q-${idx}`).classList.add('active');

    currentIdx = idx;
    const q = questions[idx];
    const selected = responses[q.q_no];

    document.getElementById('display-q-no').innerText = `Question ${idx + 1}`;
    document.getElementById('display-q-text').innerText = q.question;

    const optionsContainer = document.getElementById('display-options');
    optionsContainer.innerHTML = '';

    ['option_a', 'option_b', 'option_c', 'option_d'].forEach((optKey, i) => {
        const char = ['A', 'B', 'C', 'D'][i];
        const val = q[optKey];
        if (!val) return;

        const div = document.createElement('div');
        div.className = `option-item ${selected === char ? 'selected' : ''}`;
        div.innerHTML = `
            <input type="radio" class="option-radio" name="q_opt" value="${char}" ${selected === char ? 'checked' : ''}>
            <span class="option-label">${char}. ${val}</span>
        `;
        div.onclick = () => selectOption(q.q_no, char, div);
        optionsContainer.appendChild(div);
    });

    // Button states
    document.getElementById('prev-btn').disabled = (idx === 0);
    document.getElementById('next-btn').innerText = (idx === questions.length - 1) ? "Finish →" : "Next Question →";

    // Bookmark state
    const reviewBtn = document.getElementById('review-btn');
    if (bookmarks.has(q.q_no)) {
        reviewBtn.innerText = "Unbookmark";
        reviewBtn.classList.add('review');
    } else {
        reviewBtn.innerText = "Bookmark";
        reviewBtn.classList.remove('review');
    }
}

async function selectOption(qNo, char, element) {
    // UI Update
    responses[qNo] = char;
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input').checked = true;

    // Navigator Update
    document.getElementById(`nav-q-${currentIdx}`).classList.add('answered');

    // Network Update (Background)
    try {
        await fetch(`/api/exam/attempt/${attemptId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q_no: qNo, selected: char })
        });
    } catch (e) {
        console.warn("Autosave failed.", e);
    }
}

function toggleBookmark() {
    const qNo = questions[currentIdx].q_no;
    const navEl = document.getElementById(`nav-q-${currentIdx}`);

    if (bookmarks.has(qNo)) {
        bookmarks.delete(qNo);
        navEl.classList.remove('review');
    } else {
        bookmarks.add(qNo);
        navEl.classList.add('review');
    }
    renderQuestion(currentIdx);
}

// ===============================
// TIMER & SUBMISSION
// ===============================

function runTimer() {
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam(true);
        }

        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (timeLeft < 300) { // Red timer if < 5 mins
            timerDisplay.style.color = '#ef4444';
        }
    }, 1000);
}

async function submitExam(auto = false) {
    if (!auto && !confirm("Are you sure you want to finish the exam? This cannot be undone.")) return;

    clearInterval(timerInterval);
    document.getElementById('final-submit').disabled = true;
    document.getElementById('final-submit').innerText = "Submitting...";

    try {
        const result = await fetch(`/api/exam/attempt/${attemptId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration_seconds: 0 }) // Calculated on backend usually
        });
        const data = await result.json();

        alert(`Exam Submitted Successfully!\nYour Score: ${data.result.score} / ${data.result.total}`);
        window.location.href = '/student#results';

    } catch (err) {
        alert("Submission failed. Please contact administrator.");
        window.location.href = '/student';
    }
}

// ===============================
// EVENTS
// ===============================

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentIdx === questions.length - 1) {
        submitExam();
    } else {
        renderQuestion(currentIdx + 1);
    }
});

document.getElementById('prev-btn').addEventListener('click', () => {
    renderQuestion(currentIdx - 1);
});

document.getElementById('review-btn').addEventListener('click', toggleBookmark);
document.getElementById('final-submit').addEventListener('click', () => submitExam());

window.addEventListener('load', startExam);
