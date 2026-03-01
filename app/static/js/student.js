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
    else if (tabName === "mock-exams") loadMockExams();
    else if (tabName === "test-exams") loadTestExams();
    else if (tabName === "main-exam") loadMainExam();
    else if (tabName === "results") loadResults();
    else if (tabName === "payment") loadPayments();
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
            const enrolled = data.filter(c => c.enrollment_status === 'Enrolled').length;
            document.getElementById("courses-enrolled").innerText = enrolled;
        });

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {
            const completed = data.filter(e => e.attended === 'Attended').length;
            document.getElementById("exams-completed").innerText = completed;

            // Upcoming Exams list
            const upcomingList = document.getElementById("upcoming-exams");
            const upcoming = data.filter(e => e.attended !== 'Attended');

            if (upcoming.length > 0) {
                upcomingList.innerHTML = upcoming.map(e => `
                    <li>
                        <strong>${e.course_name}</strong> - ${e.exam_date}
                        <button class="attend-btn btn-small" onclick="goToExam(${e.exam_id})">Attend</button>
                    </li>
                `).join("");
            } else {
                upcomingList.innerHTML = '<li class="no-data">No upcoming exams</li>';
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

                if (c.enrollment_status === "Not Enrolled") {
                    statusBadge = '<span class="badge inactive">Not Enrolled</span>';
                    buttons = `<button class="attend-btn" onclick="enroll(${c.course_id})">Enroll Now</button>`;
                } else {
                    statusBadge = `<span class="badge active">Enrolled</span>`;
                    const verifyStatus = c.enrollment_verification_status || "Pending";
                    const payStatus = c.payment_verification_status || "Unpaid";

                    statusBadge += ` <span class="badge ${verifyStatus.toLowerCase()}">Status: ${verifyStatus}</span>`;
                    statusBadge += ` <span class="badge ${payStatus.toLowerCase()}">Payment: ${payStatus}</span>`;

                    if (payStatus !== "Verified" && verifyStatus === "Verified") {
                        buttons = `<button class="pay-btn" onclick="openTab('payment')">Proceed to Payment</button>`;
                    }
                    buttons += ` <button class="unenroll-btn" onclick="unenroll(${c.course_id})">Unenroll</button>`;
                }

                return `
                    <div class="course-card">
                        <div class="course-icon">📚</div>
                        <h3>${c.course_name}</h3>
                        <p>${c.description || "No description available."}</p>
                        <div class="course-meta">
                            <span><b>Fee:</b> ₹${c.fee}</span>
                            <span><b>Code:</b> ${c.course_code}</span>
                        </div>
                        <div class="course-status">${statusBadge}</div>
                        <div class="course-actions">${buttons}</div>
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
// RESULTS TAB
// ===============================
function loadResults() {
    const tbody = document.getElementById("results-tbody");
    tbody.innerHTML = '<tr><td colspan="6">Loading results...</td></tr>';

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {
            const attended = data.filter(e => e.attended === "Attended");
            if (!attended.length) {
                tbody.innerHTML = '<tr><td colspan="6">No results available yet.</td></tr>';
                return;
            }

            tbody.innerHTML = attended.map(r => `
                <tr>
                    <td>${r.exam_name}</td>
                    <td>${r.course_name}</td>
                    <td>${r.exam_date}</td>
                    <td>${r.marks || "--"}</td>
                    <td>${r.grade || "--"}</td>
                    <td><span class="status ${r.status === 'Pass' ? 'done' : 'pending'}">${r.status || "Pending"}</span></td>
                </tr>
            `).join("");
        });
}

// ===============================
// PAYMENT TAB
// ===============================
function loadPayments() {
    const tbody = document.getElementById("payment-tbody");
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

    fetch("/api/student/payments")
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                tbody.innerHTML = '<tr><td colspan="4">No payment history found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(p => `
                <tr>
                    <td>${p.course_name}</td>
                    <td>₹${p.amount}</td>
                    <td>${p.payment_date || "--"}</td>
                    <td><span class="status ${p.payment_verification_status === 'Verified' ? 'done' : 'pending'}">${p.payment_verification_status}</span></td>
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
