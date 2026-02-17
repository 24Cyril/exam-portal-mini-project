let attemptId = null;
let timeLeft = 0; // seconds
let timerInterval = null;

function renderQuestions(questions) {
    const container = document.getElementById('questions');
    container.innerHTML = '';
    questions.forEach(q => {
        const div = document.createElement('div');
        div.className = 'exam-question';
        const qh = document.createElement('div');
        qh.innerText = q.q_no + '. ' + q.question;
        div.appendChild(qh);

        ['option_a','option_b','option_c','option_d'].forEach((opt, idx) => {
            const val = ['A','B','C','D'][idx];
            const text = q[opt] || '';
            const id = `q${q.q_no}_${val}`;
            const label = document.createElement('label');
            label.style.display = 'block';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'q' + q.q_no;
            radio.value = val;
            radio.id = id;
            radio.addEventListener('change', () => {
                // save immediately
                fetch(`/api/exam/attempt/${attemptId}/save`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({q_no: q.q_no, selected: radio.value})
                }).catch(()=>{});
            });
            label.appendChild(radio);
            label.appendChild(document.createTextNode(' ' + val + '. ' + text));
            div.appendChild(label);
        });

        container.appendChild(div);
    });
}

function startTimer(seconds) {
    timeLeft = seconds;
    const el = document.getElementById('timer');
    function update() {
        const m = Math.floor(timeLeft/60).toString().padStart(2,'0');
        const s = (timeLeft%60).toString().padStart(2,'0');
        el.innerText = `Time left: ${m}:${s}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSubmit();
        }
        timeLeft -= 1;
    }
    update();
    timerInterval = setInterval(update, 1000);
}

function autoSubmit(){
    document.getElementById('btn-submit').disabled = true;
    fetch(`/api/exam/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({duration_seconds: 0})
    }).then(r=>r.json()).then(data=>{
        alert('Time over. Submitted. Score: ' + (data.result.score||0) + '/' + (data.result.total||0));
        window.location = '/student';
    }).catch(()=>{window.location = '/student';});
}

window.addEventListener('DOMContentLoaded', () => {
    // start exam
    fetch(`/api/exam/${EXAM_ID}/start`, {method:'POST'}).then(r=>r.json()).then(data=>{
        attemptId = data.attempt_id;
        renderQuestions(data.questions || []);
        startTimer((data.time_limit||30)*60);
    }).catch(err=>{console.error(err); alert('Unable to start exam');});

    document.getElementById('btn-submit').addEventListener('click', ()=>{
        const confirmSubmit = confirm('Submit exam now?');
        if(!confirmSubmit) return;
        fetch(`/api/exam/attempt/${attemptId}/submit`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({duration_seconds: 0})
        }).then(r=>r.json()).then(data=>{
            alert('Submitted. Score: ' + (data.result.score||0) + '/' + (data.result.total||0));
            window.location = '/student';
        }).catch(()=>{window.location='/student';});
    });

    document.getElementById('btn-cancel').addEventListener('click', ()=>{
        if(confirm('Cancel and leave exam?')) window.location = '/student';
    });
});
