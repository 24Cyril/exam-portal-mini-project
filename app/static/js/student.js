// ===============================
// TAB SWITCH HANDLER
// ===============================
function openTab(tabName) {

    document.getElementById("page-title").innerText = tabName.toUpperCase();

    document.querySelectorAll(".sidebar li").forEach(tab => {
        tab.classList.remove("active");
    });

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add("active");

    if (tabName === "home") loadHome();
    else if (tabName === "profile") loadProfile();
    else if (tabName === "courses") loadCourses();
    else if (tabName === "exam") loadExams();
    else if (tabName === "result") loadResults();
    else if (tabName === "certificate") loadCertificates();
    else if (tabName === "payment") loadPayments();
    else {
        document.getElementById("tab-content").innerHTML =
            `<h3>${tabName} section coming soon...</h3>`;
    }
}

// ===============================
// PROFILE
// ===============================
function loadProfile() {

    const data = studentData || {};

    document.getElementById("tab-content").innerHTML = `
        <h3>Student Profile</h3>
        <table class="profile-table">
            <tr><td>Full Name</td><td>${data.full_name || "-"}</td></tr>
            <tr><td>Age</td><td>${data.age || "-"}</td></tr>
            <tr><td>Gender</td><td>${data.gender || "-"}</td></tr>
            <tr><td>Email</td><td>${data.email || "-"}</td></tr>
            <tr><td>Phone</td><td>${data.phone || "-"}</td></tr>
            <tr><td>Address</td><td>${data.address || "-"}</td></tr>
            <tr><td>Course</td><td>${data.course || "-"}</td></tr>
            <tr><td>Department</td><td>${data.department || "-"}</td></tr>
            <tr><td>Year</td><td>${data.year_of_study || "-"}</td></tr>
        </table>
        <a href="/editpro" class="update-btn">✏️ Update Profile</a>
    `;
}

// ===============================
// HOME (Student dashboard)
// ===============================
function loadHome() {
    const name = (studentData && studentData.full_name) ? studentData.full_name.split(' ')[0] : 'Student';

    // fetch courses and exams to build quick stats
    Promise.all([
        fetch('/api/student/courses').then(r => r.json()).catch(() => []),
        fetch('/api/student/exams').then(r => r.json()).catch(() => [])
    ]).then(([courses, exams]) => {

        const enrolled = (courses || []).filter(c => c.enrollment_status !== 'Not Enrolled').length;
        const verifiedPayments = (courses || []).filter(c => c.payment_verification_status === 'Verified').length;
        const pendingPayments = (courses || []).filter(c => c.payment_verification_status === 'Submitted' || c.payment_verification_status === 'Pending').length;

        // upcoming exams (unique by course + future date)
        const upcoming = (exams || []).filter(e => e.exam_date).length;

        document.getElementById('tab-content').innerHTML = `
            <div class="card">
                <h3>Welcome back, ${name} 👋</h3>
                <p>Quick overview of your account and activity.</p>

                <div style="display:flex; gap:14px; margin-top:18px; flex-wrap:wrap;">
                    <div class="stat-card">
                        <div class="stat-value">${enrolled}</div>
                        <div class="stat-label">Enrolled Courses</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${upcoming}</div>
                        <div class="stat-label">Upcoming Exams</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${verifiedPayments}</div>
                        <div class="stat-label">Payments Verified</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${pendingPayments}</div>
                        <div class="stat-label">Pending Payments</div>
                    </div>
                </div>

                <div style="margin-top:20px; display:flex; gap:8px;">
                    <button class="attend-btn" onclick="openTab('courses')">View Courses</button>
                    <button class="pay-btn" onclick="openTab('payment')">Payment</button>
                    <button class="result-btn" onclick="openTab('exam')">Exams</button>
                </div>
            </div>
        `;
    });
}

// ===============================
// COURSES
// ===============================
let allCourses = [];

function loadCourses() {

    document.getElementById("tab-content").innerHTML = `
        <div class="card">
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" id="searchCourse" placeholder="Search..." onkeyup="applyFilters()">
                <select id="sortCourse" onchange="applyFilters()">
                    <option value="">Sort</option>
                    <option value="az">A-Z</option>
                    <option value="za">Z-A</option>
                </select>
                <select id="statusFilter" onchange="applyFilters()">
                    <option value="">Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <div id="course-list" class="course-grid"></div>
        </div>
    `;

    fetch("/api/student/courses")
        .then(res => res.json())
        .then(data => {
            allCourses = data;
            renderCourses(data);
        });
}

function renderCourses(courses) {

    const container = document.getElementById("course-list");
    container.innerHTML = "";

    courses.forEach(c => {

        let buttons = "";
        let statusText = "";

        if (c.enrollment_status === "Not Enrolled") {

            statusText = `<span class="badge inactive">Not Enrolled</span>`;
            buttons = `
                <button class="attend-btn" onclick="enroll(${c.course_id})">
                    Enroll
                </button>
            `;

        } else {

            statusText = `
                <span class="badge active">Enrolled</span>
                <span class="badge ${c.enrollment_verification_status === "Verified" ? "active" : c.enrollment_verification_status === "Rejected" ? "inactive" : "pending"}">
                    Enrollment: ${c.enrollment_verification_status || "Pending"}
                </span>
            `;

            // Only show payment status if enrollment is verified
            if (c.enrollment_verification_status === "Verified") {
                statusText += `
                    <span class="badge ${c.payment_verification_status === "Verified" ? "active" : "inactive"}">
                        Payment: ${c.payment_verification_status || "Pending"}
                    </span>
                `;

                // Show pay button only if enrollment is verified and payment is not verified
                if (c.payment_verification_status !== "Verified") {
                    buttons += `
                        <button class="pay-btn" onclick="openTab('payment')">
                            Pay
                        </button>
                    `;
                }
            }

            buttons += `
                <button class="unenroll-btn" onclick="unenroll(${c.course_id})">
                    Unenroll
                </button>
            `;
        }

        container.innerHTML += `
            <div class="course-card">
                <h4>${c.course_name}</h4>
                <p>${c.description || ""}</p>
                <p><b>Fee:</b> ₹${c.fee}</p>
                ${statusText}
                <div class="btn-group">${buttons}</div>
            </div>
        `;
    });
}

function applyFilters() {

    let filtered = [...allCourses];

    const search = document.getElementById("searchCourse").value.toLowerCase();
    const sort = document.getElementById("sortCourse").value;
    const status = document.getElementById("statusFilter").value;

    if (search)
        filtered = filtered.filter(c => c.course_name.toLowerCase().includes(search));

    if (status)
        filtered = filtered.filter(c => c.status === status);

    if (sort === "az") filtered.sort((a,b)=>a.course_name.localeCompare(b.course_name));
    if (sort === "za") filtered.sort((a,b)=>b.course_name.localeCompare(a.course_name));

    renderCourses(filtered);
}

// ===============================
// PAYMENTS (FIXED)
// ===============================
function loadPayments() {

    fetch("/api/student/payments")
        .then(res => res.json())
        .then(data => {

            if (!data || !data.length) {
                document.getElementById("tab-content").innerHTML =
                    "<h3>No payment records found</h3>";
                return;
            }

            let rows = data.map((p, i) => {

                let actionCell = "";
                const receiptBtn = p.payment_id ? `<button class="edit-btn" onclick="window.open('/payment/receipt/${p.payment_id}','_blank')">Receipt</button>` : '';

                if (p.payment_verification_status === "Pending") {
                    actionCell = `
                        <div style="display:flex; gap:8px; align-items:center;">
                            <button class="pay-btn" onclick="submitPayment(${p.course_id})">
                                Submit Payment
                            </button>
                            ${receiptBtn}
                        </div>
                    `;
                } else {
                    actionCell = `
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span class="status done">${p.payment_verification_status}</span>
                            ${receiptBtn}
                        </div>
                    `;
                }

                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${p.course_name}</td>
                        <td>₹${p.amount || "-"}</td>
                        <td>${p.payment_method || "-"}</td>
                        <td>${p.transaction_id || "-"}</td>
                        <td>${actionCell}</td>
                        <td>${p.payment_date || "-"}</td>
                    </tr>
                `;
            }).join("");

            document.getElementById("tab-content").innerHTML = `
                <div class="table-wrapper">
                    <h3>Payment History</h3>
                    <table class="common-table">
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Course</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Transaction ID</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        })
        .catch(() => {
            document.getElementById("tab-content").innerHTML =
                "<h3>Error loading payments</h3>";
        });
}

function submitPayment(courseId) {

    fetch("/api/payment/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            course_id: courseId,
            payment_method: "UPI",
            transaction_id: "REF" + Date.now()
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Payment submitted. Waiting for admin verification.");
        loadPayments();
        loadCourses(); // sync badge state
    });
}

// ===============================
// ENROLL / UNENROLL
// ===============================
function enroll(courseId) {
    fetch("/api/student/enroll", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ course_id: courseId })
    })
    .then(() => loadCourses());
}

function unenroll(courseId) {
    fetch("/api/student/unenroll", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ course_id: courseId })
    })
    .then(() => loadCourses());
}

// ===============================
// EXAMS (FETCH FROM DB + REMOVE DUPES)
// ===============================
function loadExams() {

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {

            // 🔥 REMOVE DUPLICATES (course + date)
            const unique = {};
            data.forEach(e => {
                const key = e.course_name + e.exam_date;
                if (!unique[key]) unique[key] = e;
            });

            const exams = Object.values(unique);

            let rows = exams.map((e, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${e.course_name}</td>
                    <td>--</td>
                    <td>${e.exam_date}</td>
                    <td>
                        <span class="attendance ${e.attended === "Attended" ? "yes" : "no"}">
                            ${e.attended}
                        </span>
                    </td>
                    <td>--</td>
                    <td>--</td>
                    <td>
                        ${
                            e.attended === "Attended"
                            ? `<button class="result-btn" onclick="openTab('result')">View Result</button>`
                            : `<button class="attend-btn">Attend</button>`
                        }
                    </td>
                </tr>
            `).join("");

            document.getElementById("tab-content").innerHTML = `
                <div class="table-wrapper">
                    <h3>Exam Status</h3>
                    <table class="common-table">
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Course</th>
                                <th>Duration</th>
                                <th>Date</th>
                                <th>Attendance</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        });
}

// ===============================
// RESULTS (FROM SAME TABLE)
// ===============================
function loadResults() {

    fetch("/api/student/exams")
        .then(res => res.json())
        .then(data => {

            let rows = data.map((r, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${r.course_name}</td>
                    <td>${r.exam_date}</td>
                    <td>${r.marks}</td>
                    <td>${r.grade}</td>
                    <td>
                        <span class="attendance ${r.attended === "Attended" ? "yes" : "no"}">
                            ${r.attended}
                        </span>
                    </td>
                    <td>
                        <span class="status ${r.status === "Pass" ? "done" : "pending"}">
                            ${r.status}
                        </span>
                    </td>
                </tr>
            `).join("");

            document.getElementById("tab-content").innerHTML = `
                <div class="table-wrapper">
                    <h3>Exam Results</h3>
                    <table class="common-table">
                        <thead>
                            <tr>
                                <th>Sl No</th>
                                <th>Course</th>
                                <th>Date</th>
                                <th>Marks</th>
                                <th>Grade</th>
                                <th>Attendance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
        });
}

// ===============================
// OTHERS
// ===============================
function loadCertificates() {
    document.getElementById("tab-content").innerHTML = "<h3>Certificates</h3>";
}

function logout() {
    window.location.href = "/logout";
}

document.addEventListener("DOMContentLoaded", () => {
    openTab("home");
});
