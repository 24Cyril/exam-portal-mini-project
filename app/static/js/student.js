// ===============================
// TAB SWITCH HANDLER
// ===============================
function openTab(tabName) {
    // 1. Title update
    document.getElementById("page-title").innerText = tabName.toUpperCase();

    // 2. Sidebar active state
    document.querySelectorAll(".sidebar li").forEach(tab => {
        tab.classList.remove("active");
    });
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add("active");

    // 3. Tab content toggling
    document.querySelectorAll(".tab-content").forEach(content => {
        content.style.display = "none";
    });

    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.style.display = "block";
    }

    // 4. Data loading
    if (tabName === "home") loadHome();
    else if (tabName === "profile") loadProfile();
    else if (tabName === "courses") loadCourses();
    else if (tabName === "notes") loadNotes();
    else if (tabName === "mock-exams") loadMockExams();
    else if (tabName === "test-exams") loadTestExams();
    else if (tabName === "main-exam") loadMainExam();
    else if (tabName === "results") loadResults();
    else if (tabName === "payment") loadPayments();
    else if (tabName === "performance") loadPerformance();
    else {
        // Fallback for sections coming soon
        if (targetContent && targetContent.innerHTML.trim() === "") {
            targetContent.innerHTML = `<div class="card"><h3>${tabName} section coming soon...</h3></div>`;
        }
    }
}

// ===============================
// HOME TAB
// ===============================
function loadHome() {
    fetch("/api/student/courses")
        .then(res => res.json())
        .then(data => {
            const enrolled = data.filter(c => c.enrollment_status === 'Enrolled_Active').length;
            document.getElementById("courses-enrolled").innerText = enrolled;
        });

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {
            const exams = data.exams || [];
            const completed = exams.filter(e => e.score !== null);
            document.getElementById("exams-completed").innerText = completed.length;

            // Calculate Overall Grade
            if (completed.length > 0) {
                const totalScore = completed.reduce((sum, e) => sum + e.score, 0);
                const avg = totalScore / completed.length;
                document.getElementById("overall-grade").innerText = calculateGrade(avg) + ` (${avg.toFixed(1)}%)`;
                renderHomePerformanceChart(completed);
            }

            // Upcoming Exams list
            const upcomingList = document.getElementById("upcoming-exams");
            const upcoming = exams.filter(e => e.score === null);

            if (upcoming.length > 0) {
                upcomingList.innerHTML = upcoming.map(e => `
                    <li>
                        <strong>${e.course_name}</strong> - ${e.exam_date}
                        <button class="attend-btn btn-small" onclick="goToExam(${e.exam_id})">Attend Now</button>
                    </li>
                `).join("");
            } else {
                upcomingList.innerHTML = '<li class="no-data">No upcoming exams</li>';
            }
        });
}

function renderHomePerformanceChart(completed) {
    const ctx = document.getElementById('homePerformanceChart').getContext('2d');
    if (window.homeChartIns) window.homeChartIns.destroy();

    window.homeChartIns = new Chart(ctx, {
        type: 'line',
        data: {
            labels: completed.map(e => e.exam_name || e.course_name),
            datasets: [{
                label: 'Score History',
                data: completed.map(e => e.score),
                borderColor: '#2563eb',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.1)'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

// ===============================
// PROFILE TAB
// ===============================
function loadProfile() {
    const data = studentData || {};

    // Header info
    document.getElementById("profile-name").innerText = data.full_name || "Name not set";
    document.getElementById("profile-email").innerText = data.email || "";
    document.getElementById("profile-course").innerText = data.course || "";
    document.getElementById("profile-year").innerText = data.year_of_study ? `Year ${data.year_of_study}` : "";

    // Personal 
    document.getElementById("dob").innerText = data.dob || "--";
    document.getElementById("age").innerText = data.age || "--";
    document.getElementById("gender").innerText = data.gender || "--";
    document.getElementById("blood-group").innerText = data.blood_group || "--";
    document.getElementById("nationality").innerText = data.nationality || "--";

    // Contact
    document.getElementById("contact-email").innerText = data.email || "--";
    document.getElementById("phone").innerText = data.phone || "--";
    document.getElementById("emergency-contact").innerText = data.emergency_contact || "--";

    // Address
    document.getElementById("address").innerText = data.address || "--";
    document.getElementById("city").innerText = data.city || "--";
    document.getElementById("state").innerText = data.state || "--";
    document.getElementById("pincode").innerText = data.pincode || "--";
    document.getElementById("country").innerText = data.country || "--";

    // Academic
    document.getElementById("academic-course").innerText = data.course || "--";
    document.getElementById("department").innerText = data.department || "--";
    document.getElementById("institute").innerText = data.institute_name || "--";
    document.getElementById("year-of-study").innerText = data.year_of_study || "--";
    document.getElementById("semester").innerText = data.semester || "--";
    document.getElementById("roll-number").innerText = data.roll_number || "--";
}

function editProfile() {
    window.location.href = "/editpro";
}

// ===============================
// COURSES TAB
// ===============================
function loadCourses() {
    const grid = document.getElementById("courses-grid");
    grid.innerHTML = '<div class="loader">Loading courses...</div>';

    fetch("/api/student/courses")
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                grid.innerHTML = '<div class="no-data">No courses available at this time.</div>';
                return;
            }

            grid.innerHTML = data.map(c => {
                let statusBadge = "";
                let buttons = "";
                const enrollmentStatus = c.enrollment_status;

                if (!enrollmentStatus || enrollmentStatus === "Not Enrolled") {
                    statusBadge = '<span class="badge inactive">Not Enrolled</span>';
                    buttons = `<button class="attend-btn" onclick="enroll(${c.course_id})">Enroll Now</button>`;
                } else {
                    let badgeClass = "pending";
                    let statusLabel = enrollmentStatus.replace(/_/g, " ");

                    if (enrollmentStatus === "Enrolled_Active") badgeClass = "active";
                    else if (enrollmentStatus === "Rejected") badgeClass = "inactive";
                    else if (enrollmentStatus === "Verified_Pending_Payment") badgeClass = "warning";

                    statusBadge = `<span class="badge ${badgeClass}">${statusLabel}</span>`;

                    if (enrollmentStatus === "Verified_Pending_Payment") {
                        buttons = `<button class="pay-btn" onclick="showPaymentModal(${c.course_id}, ${c.fee})">💰 Pay Fee (₹${c.fee})</button>`;
                    } else if (enrollmentStatus === "Pending") {
                        buttons = `<button class="unenroll-btn" onclick="unenroll(${c.course_id})">Cancel Request</button>`;
                    }
                }

                return `
                    <div class="course-card">
                        <div class="course-icon">📚</div>
                        <div class="course-content">
                            <h3>${c.course_name}</h3>
                            <p class="course-desc">${c.description || "No description available."}</p>
                            <div class="course-meta">
                                <span><b>Fee:</b> ₹${c.fee}</span>
                                <span><b>Code:</b> ${c.course_code}</span>
                            </div>
                            <div class="course-status">${statusBadge}</div>
                            <div class="course-actions">${buttons}</div>
                        </div>
                    </div>
                `;
            }).join("");
        });
}

function enroll(courseId) {
    fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId })
    }).then(() => loadCourses());
}

function unenroll(courseId) {
    if (!confirm("Are you sure you want to unenroll?")) return;
    fetch("/api/student/unenroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId })
    }).then(() => loadCourses());
}

// ===============================
// EXAMS TABS (MOCK / TEST / MAIN)
// ===============================
function loadMockExams() {
    fetchExamsByType("Mock", "mock-exams-list");
}

function loadTestExams() {
    fetchExamsByType("Test", "test-exams-list");
}

function loadMainExam() {
    fetchExamsByType("Main", "main-exam-container");
}

function fetchExamsByType(type, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '<div class="no-data">Loading...</div>';

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {
            const filtered = data.filter(e => e.exam_type === type);
            if (!filtered.length) {
                list.innerHTML = `<div class="no-data">No ${type} exams available.</div>`;
                return;
            }

            // Using existing list class if it's a list, or just grid
            list.innerHTML = filtered.map(e => `
                <div class="exam-card">
                    <h4>${e.exam_name}</h4>
                    <p>Course: ${e.course_name}</p>
                    <p>Date: ${e.exam_date}</p>
                    <p>Questions: ${e.total_questions}</p>
                    <p>Status: <strong>${e.attended}</strong></p>
                    ${e.attended !== "Attended"
                    ? `<button class="attend-btn" onclick="goToExam(${e.exam_id})">Start Exam</button>`
                    : `<button class="result-btn" onclick="openTab('results')">View Result</button>`}
                </div>
            `).join("");
        });
}

function goToExam(examId) {
    window.location.href = `/exam/${examId}`;
}

// ===============================
// NOTES TAB
// ===============================
function loadNotes() {
    const container = document.getElementById("notes-container");
    container.innerHTML = '<div class="loader">Loading your materials...</div>';

    fetch("/api/student/notes")
        .then(res => res.json())
        .then(data => {
            const notes = data.notes || [];
            if (!notes.length) {
                container.innerHTML = '<div class="no-data">No course materials available for your enrolled courses.</div>';
                return;
            }

            container.innerHTML = notes.map(n => `
                <div class="card note-card" style="margin-bottom:15px; border-left: 5px solid #4a90e2;">
                    <h4 style="margin-bottom:5px;">${n.title}</h4>
                    <p style="color:#666; font-size:0.9em; margin-bottom:10px;">Subject: ${n.course_name}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.85em; color:#888;">Added: ${n.created_at || ""}</span>
                        <a href="${n.file_path}" target="_blank" class="attend-btn btn-small" style="text-decoration:none;">📄 View / Download</a>
                    </div>
                </div>
            `).join("");
        });
}

// ===============================
// RESULTS TAB
// ===============================
function loadResults() {
    const tbody = document.getElementById("results-tbody");
    tbody.innerHTML = '<tr><td colspan="6">Loading results...</td></tr>';

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {
            const attended = (data.exams || []).filter(e => e.score !== null);
            if (!attended.length) {
                tbody.innerHTML = '<tr><td colspan="6">No results available yet. Complete exams and wait for publication.</td></tr>';
                return;
            }

            tbody.innerHTML = attended.map(r => `
                <tr>
                    <td>${r.exam_name}</td>
                    <td>${r.course_name}</td>
                    <td>${r.submitted_at || "--"}</td>
                    <td>${r.score || "0"}</td>
                    <td>${calculateGrade(r.score)}</td>
                    <td><span class="badge ${r.evaluation_status === 'Evaluated' && r.score >= 50 ? 'active' : 'inactive'}">${r.evaluation_status || "Pending"}</span></td>
                </tr>
            `).join("");
        });
}

function calculateGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ===============================
// PAYMENT TAB & MODAL
// ===============================
let currentPayCourseId = null;

function showPaymentModal(courseId, amount) {
    currentPayCourseId = courseId;
    document.getElementById("paymentCourseName").innerText = "Course ID: " + courseId;
    document.getElementById("paymentAmount").innerText = "Grand Total: ₹" + amount;
    document.getElementById("paymentModal").style.display = "block";
}

function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
}

function confirmPayment() {
    const method = document.getElementById("payMethod").value;
    const txn = document.getElementById("txnId").value;
    if (!txn) return alert("Please enter Transaction ID / UTR");

    fetch("/api/payment/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            course_id: currentPayCourseId,
            payment_type: "Registration",
            transaction_id: txn,
            payment_method: method
        })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || "Payment Submitted");
            closePaymentModal();
            loadCourses();
            loadPayments();
        });
}

function loadPayments() {
    const tbody = document.getElementById("payment-tbody");
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    fetch("/api/student/payments")
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="6">No payment history found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(p => `
                <tr>
                    <td>${p.course_name}</td>
                    <td>₹${p.amount}</td>
                    <td>${p.payment_type}</td>
                    <td><span class="badge ${p.status === 'Verified' ? 'active' : 'pending'}">${p.status}</span></td>
                    <td>${p.transaction_id || "--"}</td>
                    <td>${p.created_at || "--"}</td>
                </tr>
            `).join("");
        });
}

// ===============================
// INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    // Check URL hash for tab navigation
    const hash = window.location.hash.replace("#", "");
    openTab(hash || "home");
});
