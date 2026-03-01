function openTab(tabName) {

    document.getElementById("tab-title").innerText = tabName.toUpperCase();

    if (tabName === "profile") {
        document.getElementById("tab-content").innerHTML =
            document.getElementById("profile-content").innerHTML;
        return;
    }

    if (tabName === "home") {
        loadAdminHome();
        return;
    }

    if (tabName === "students") {
        loadStudents();
        return;
    }

    if (tabName === "courses") {
        loadCourses();
        return;
    }

    if (tabName === "registration") {
        loadRegistrations();
        return;
    }

    if (tabName === "payment") {
        loadPayments();
        return;
    }

    if (tabName === "exam") {
        loadExams();
        return;
    }

    if (tabName === "teachers") {
        loadTeachers();
        return;
    }

    if (tabName === "departments") {
        loadDepartments();
        return;
    }

    if (tabName === "performance") {
        loadPerformance();
        return;
    }

    document.getElementById("tab-content").innerHTML =
        `<p>${tabName} module coming soon...</p>`;
}

function loadAdminHome() {
    Promise.all([
        fetch('/teacher/students').then(r => r.json()).then(d => d.students || []).catch(() => []),
        fetch('/teacher/courses').then(r => r.json()).then(d => d.courses || []).catch(() => []),
        fetch('/teacher/enrollments').then(r => r.json()).then(d => d.enrollments || []).catch(() => []),
        fetch('/teacher/payments').then(r => r.json()).then(d => d.payments || []).catch(() => [])
    ]).then(([students, courses, enrollments, payments]) => {
        const totalStudents = (students || []).length;
        const totalCourses = (courses || []).length;
        const pendingEnrollments = (enrollments || []).length;
        const pendingPayments = (payments || []).filter(p => (p.verification_status || '').toLowerCase() === 'pending' || (p.verification_status || '').toLowerCase() === 'submitted').length;
        const verifiedPayments = (payments || []).filter(p => (p.verification_status || '').toLowerCase() === 'verified').length;

        document.getElementById('tab-content').innerHTML = `
            <div class="card admin-home">
                <h3>Teacher Dashboard</h3>
                <p>Overview of system activity and quick actions.</p>

                <div class="admin-stats" style="display:flex; gap:14px; margin-top:18px; flex-wrap:wrap;">
                    <div class="stat-card"><div class="stat-value">${totalStudents}</div><div class="stat-label">Students</div></div>
                    <div class="stat-card"><div class="stat-value">${totalCourses}</div><div class="stat-label">Courses</div></div>
                    <div class="stat-card"><div class="stat-value">${pendingEnrollments}</div><div class="stat-label">Pending Enrollments</div></div>
                    <div class="stat-card"><div class="stat-value">${pendingPayments}</div><div class="stat-label">Pending Payments</div></div>
                    <div class="stat-card"><div class="stat-value">${verifiedPayments}</div><div class="stat-label">Payments Verified</div></div>
                </div>

                <div style="margin-top:18px; display:flex; gap:10px;">
                    <button class="add-btn" onclick="openTab('students')">Manage Students</button>
                    <button class="add-btn" onclick="openTab('courses')">Manage Courses</button>
                    <button class="add-btn" onclick="openTab('payment')">Payments</button>
                </div>
            </div>
        `;
    });
}

/* =====================================================
   STUDENTS (already working)
===================================================== */

function loadStudents() {
    fetch("/teacher/students")
        .then(res => res.json())
        .then(data => renderStudentTable(data.students));
}

function renderStudentTable(students) {

    let rows = students.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.full_name || ""}</td>
            <td>${s.email || ""}</td>
            <td>${s.phone || ""}</td>
            <td>${s.gender || ""}</td>
            <td>${s.course || ""}</td>
            <td>${s.department || ""}</td>
            <td>${s.year_of_study || ""}</td>
            <td>${s.institute_name || ""}</td>
            <td>${s.created_at || ""}</td>
            <td>
                <button class="edit-btn" onclick="editStudent(${s.id})">✏ Edit</button>
                <button class="delete-btn" onclick="deleteStudent(${s.id})">🗑 Delete</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput"
                   placeholder="Search students..."
                   onkeyup="searchTable()">
            <button class="add-btn" onclick="openAddStudent()">➕ Add Student</button>
        </div>

        <table class="profile-table" id="adminTable">
            <tr>
                <th onclick="sortTable(0)">ID</th>
                <th onclick="sortTable(1)">Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th onclick="sortTable(5)">Course</th>
                <th>Department</th>
                <th onclick="sortTable(7)">Year</th>
                <th>Institute</th>
                <th onclick="sortTable(9)">Created</th>
                <th>Actions</th>
            </tr>
            ${rows}
        </table>
    `;
}

function openAddStudent() {
    location.href = "/teacher/add-student";
}

function editStudent(id) {
    location.href = "/teacher/edit-student/" + id;
}

function deleteStudent(id) {
    if (confirm("Delete this student?")) {
        fetch("/teacher/delete-student/" + id, { method: "POST" })
            .then(() => loadStudents());
    }
}

/* =====================================================
   COURSES TAB (NEW)
===================================================== */

function loadCourses() {
    fetch("/teacher/courses")
        .then(res => res.json())
        .then(data => renderCoursesTable(data.courses));
}

function renderCoursesTable(courses) {

    let rows = courses.map(c => `
        <tr>
            <td>${c.course_id}</td>
            <td>${c.course_name}</td>
            <td>${c.course_code}</td>
            <td>${c.duration || ""}</td>
            <td>${c.fee}</td>
            <td>${c.status}</td>
            <td>${c.created_at}</td>
            <td>
                <button class="edit-btn" onclick="editCourse(${c.course_id})">✏ Edit</button>
                <button class="delete-btn" onclick="deleteCourse(${c.course_id})">🗑 Delete</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput"
                   placeholder="Search courses..."
                   onkeyup="searchTable()">

            <select id="statusFilter" onchange="filterCourses()">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>

            <button class="add-btn" onclick="addCourse()">➕ Add Course</button>
        </div>

        <table class="profile-table" id="adminTable">
            <tr>
                <th onclick="sortTable(0)">ID</th>
                <th onclick="sortTable(1)">Course Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th onclick="sortTable(4)">Fee</th>
                <th>Status</th>
                <th onclick="sortTable(6)">Created</th>
                <th>Actions</th>
            </tr>
            ${rows}
        </table>
    `;
}

/* =====================================================
   SEARCH (universal)
===================================================== */

function searchTable() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.querySelectorAll("#adminTable tr");

    rows.forEach((row, i) => {
        if (i === 0) return;
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

/* =====================================================
   FILTER FOR COURSES
===================================================== */

function filterCourses() {
    let filter = document.getElementById("statusFilter").value;
    let rows = document.querySelectorAll("#adminTable tr");

    rows.forEach((row, i) => {
        if (i === 0) return;
        let status = row.children[5].innerText;
        row.style.display = (!filter || status === filter) ? "" : "none";
    });
}

/* =====================================================
   SORT (universal)
===================================================== */

function sortTable(colIndex) {
    let table = document.getElementById("adminTable");
    let rows = Array.from(table.rows).slice(1);

    rows.sort((a, b) =>
        a.cells[colIndex].innerText.localeCompare(
            b.cells[colIndex].innerText,
            undefined,
            { numeric: true }
        )
    );

    rows.forEach(r => table.appendChild(r));
}

/* =====================================================
   ENROLLMENTS (REGISTRATION) TAB
===================================================== */

function loadEnrollments() {
    fetch("/teacher/enrollments")
        .then(res => res.json())
        .then(data => renderEnrollmentsTable(data.enrollments));
}

function renderEnrollmentsTable(enrollments) {

    if (!enrollments || enrollments.length === 0) {
        document.getElementById("tab-content").innerHTML = `
            <h3>No Pending Enrollments</h3>
            <p>All enrollment requests have been processed.</p>
        `;
        return;
    }

    let rows = enrollments.map(e => `
        <tr>
            <td>${e.id}</td>
            <td>${e.student_name || ""}</td>
            <td>${e.email || ""}</td>
            <td>${e.course_name}</td>
            <td><span class="badge ${e.status === 'Pending' ? 'pending' : 'active'}">${e.status}</span></td>
            <td>${e.created_at || ""}</td>
            <td>
                <button class="verify-btn" onclick="verifyEnrollment(${e.id})">✓ Verify</button>
                <button class="reject-btn" onclick="rejectEnrollment(${e.id})">✗ Reject</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <h3>Pending Enrollments</h3>
        <table class="profile-table">
            <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
            ${rows}
        </table>
    `;
}

function verifyEnrollment(enrollmentId) {
    if (!confirm("Verify this enrollment? Student will be able to pay fees.")) return;

    fetch(`/teacher/enrollments/verify/${enrollmentId}`, { method: "POST" })
        .then(res => res.json())
        .then(() => {
            alert("Enrollment verified successfully!");
            loadEnrollments();
        })
        .catch(err => alert("Error: " + err));
}

function rejectEnrollment(enrollmentId) {
    if (!confirm("Reject this enrollment? Student will not be able to proceed.")) return;

    fetch(`/teacher/enrollments/reject/${enrollmentId}`, { method: "POST" })
        .then(res => res.json())
        .then(() => {
            alert("Enrollment rejected!");
            loadEnrollments();
        })
        .catch(err => alert("Error: " + err));
}

/* =====================================================
   PAYMENTS TAB (filters + pagination + receipts)
===================================================== */

let adminPayments = [];
let paymentsFiltered = [];
let paymentsPageSize = 10;
let paymentsCurrentPage = 1;

function loadPayments() {
    fetch("/teacher/payments")
        .then(res => res.json())
        .then(data => {
            adminPayments = data.payments || [];

            document.getElementById("tab-content").innerHTML = `
                <div class="card">
                    <div class="search-box payments-filters">
                        <input type="text" id="paymentsSearchInput" placeholder="Search payments..." onkeyup="applyPaymentsFilters()">

                        <select id="paymentsStatusFilter" onchange="applyPaymentsFilters()">
                            <option value="">All Status</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Pending">Pending</option>
                            <option value="Verified">Verified</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <label>From <input type="date" id="paymentsFromDate" onchange="applyPaymentsFilters()"></label>
                        <label>To <input type="date" id="paymentsToDate" onchange="applyPaymentsFilters()"></label>

                        <select id="paymentsPageSize" onchange="changePaymentsPageSize()">
                            <option value="10">10 / page</option>
                            <option value="25">25 / page</option>
                            <option value="50">50 / page</option>
                        </select>
                    </div>

                    <div id="paymentsTableWrapper"></div>
                </div>
            `;

            applyPaymentsFilters();
        });
}

function applyPaymentsFilters() {
    const q = document.getElementById('paymentsSearchInput').value.toLowerCase();
    const status = document.getElementById('paymentsStatusFilter').value;
    const from = document.getElementById('paymentsFromDate').value;
    const to = document.getElementById('paymentsToDate').value;

    paymentsFiltered = adminPayments.filter(p => {
        let ok = true;

        if (q) {
            const hay = `${p.student_name || ''} ${p.email || ''} ${p.course_name || ''} ${p.transaction_id || ''}`.toLowerCase();
            ok = ok && hay.includes(q);
        }

        if (status) ok = ok && ((p.verification_status || '').toString() === status);
        if (from) ok = ok && (p.payment_date && p.payment_date >= from);
        if (to) ok = ok && (p.payment_date && p.payment_date <= to);

        return ok;
    });

    paymentsCurrentPage = 1;
    renderPaymentsPage();
}

function changePaymentsPageSize() {
    paymentsPageSize = parseInt(document.getElementById('paymentsPageSize').value, 10) || 10;
    paymentsCurrentPage = 1;
    renderPaymentsPage();
}

function renderPaymentsPage() {
    const total = paymentsFiltered.length;
    const pages = Math.max(1, Math.ceil(total / paymentsPageSize));
    if (paymentsCurrentPage > pages) paymentsCurrentPage = pages;
    const start = (paymentsCurrentPage - 1) * paymentsPageSize;
    const pageItems = paymentsFiltered.slice(start, start + paymentsPageSize);

    renderPaymentsTable(pageItems);

    // pagination controls
    const pager = document.createElement('div');
    pager.className = 'pagination';

    let html = `<div class="pagination-controls">`;
    html += `<button ${paymentsCurrentPage === 1 ? 'disabled' : ''} onclick="paymentsPrevPage()">Prev</button>`;
    for (let i = 1; i <= pages; i++) html += `<button class="${i === paymentsCurrentPage ? 'active' : ''}" onclick="paymentsGoTo(${i})">${i}</button>`;
    html += `<button ${paymentsCurrentPage === pages ? 'disabled' : ''} onclick="paymentsNextPage()">Next</button>`;
    html += `</div><div class="pagination-info">Showing ${start + 1}-${Math.min(start + paymentsPageSize, total)} of ${total}</div>`;

    pager.innerHTML = html;

    const wrapper = document.getElementById('paymentsTableWrapper');
    wrapper.appendChild(pager);
}

function paymentsPrevPage() { if (paymentsCurrentPage > 1) { paymentsCurrentPage--; renderPaymentsPage(); } }
function paymentsNextPage() { paymentsCurrentPage++; renderPaymentsPage(); }
function paymentsGoTo(n) { paymentsCurrentPage = n; renderPaymentsPage(); }

function renderPaymentsTable(payments) {
    const rows = (payments || []).map(p => {
        const status = (p.verification_status || '').toString();

        // receipt button (always visible if payment exists)
        const receiptBtn = p.payment_id ? `<button class="edit-btn" onclick="window.open('/payment/receipt/${p.payment_id}','_blank')">Receipt</button>` : '';

        let action = '';
        if ((status || '').toLowerCase() === 'submitted' || (status || '').toLowerCase() === 'pending') {
            action = `
                <button class="verify-btn" onclick="verifyPayment(${p.payment_id})">✓ Verify</button>
                <button class="reject-btn" onclick="rejectPayment(${p.payment_id})">✗ Reject</button>
                ${receiptBtn}
            `;
        } else {
            action = `${receiptBtn} <span class="badge ${status === 'Verified' ? 'active' : status === 'Rejected' ? 'inactive' : 'pending'}">${status || '-'}</span>`;
        }

        return `
            <tr>
                <td>${p.payment_id}</td>
                <td>${p.student_name || ''}</td>
                <td>${p.email || ''}</td>
                <td>${p.course_name || ''}</td>
                <td>₹${p.amount || ''}</td>
                <td>${p.payment_type || 'Registration'}</td>
                <td>${p.transaction_id || ''}</td>
                <td>${p.created_at || ''}</td>
                <td>${action}</td>
            </tr>
        `;
    }).join('');

    const wrapper = document.getElementById('paymentsTableWrapper');
    wrapper.innerHTML = `
        <h3>Payments</h3>
        <table class="profile-table">
            <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
            ${rows || '<tr><td colspan="9" class="empty-msg">No payments found</td></tr>'}
        </table>
    `;
}

/* =====================================================
   EXAMS TAB
===================================================== */

function loadExams() {
    fetch("/teacher/exams")
        .then(res => res.json())
        .then(data => renderExamsTable(data.exams));
}

function renderExamsTable(exams) {
    let rows = exams.map(e => `
        <tr>
            <td>${e.exam_id}</td>
            <td>${e.exam_name}</td>
            <td>${e.course_name}</td>
            <td>${e.exam_date}</td>
            <td>${e.status || "Scheduled"}</td>
            <td>${e.question_file || "-"}</td>
            <td>${e.answer_file || "-"}</td>
            <td>
                <button class="delete-btn" onclick="deleteExam(${e.exam_id})">🗑 Delete</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput"
                   placeholder="Search exams..."
                   onkeyup="searchTable()">
            <button class="add-btn" onclick="openAddExam()">➕ Add Exam</button>
        </div>

        <table class="profile-table" id="adminTable">
            <tr>
                <th>ID</th>
                <th>Exam Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
                <th>Question File</th>
                <th>Answer File</th>
                <th>Actions</th>
            </tr>
            ${rows}
        </table>
    `;
}

function openAddExam() {
    location.href = "/teacher/add-exam";
}

function deleteExam(id) {
    if (confirm("Delete this exam?")) {
        fetch("/teacher/delete-exam/" + id, { method: "POST" })
            .then(() => loadExams());
    }
}

/* =====================================================
   REGISTRATIONS (STUDENT COURSES) TAB
===================================================== */

function loadRegistrations() {
    fetch("/teacher/registrations")
        .then(res => res.json())
        .then(data => renderRegistrationsTable(data.registrations));
}

function renderRegistrationsTable(registrations) {
    let rows = registrations.map(r => `
        <tr>
            <td>${r.full_name}</td>
            <td>${r.course_name}</td>
            <td>${r.enrollment_status}</td>
            <td>${r.payment_status}</td>
            <td>${r.registered_at}</td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput"
                   placeholder="Search registrations..."
                   onkeyup="searchTable()">
        </div>

        <table class="profile-table" id="adminTable">
            <tr>
                <th>Student Name</th>
                <th>Course Name</th>
                <th>Enrollment Status</th>
                <th>Payment Status</th>
                <th>Registered At</th>
            </tr>
            ${rows}
        </table>
    `;
}

/* =====================================================
   DEFAULT TAB
===================================================== */

window.onload = () => openTab("home");



function addCourse() {
    location.href = "/teacher/add-course";
}

function editCourse(id) {
    location.href = "/teacher/edit-course/" + id;
}

function deleteCourse(id) {
    if (confirm("Delete this course? This will also remove all enrollments and payments associated with it.")) {
        fetch("/teacher/delete-course/" + id, { method: "POST" })
            .then(res => res.json())
            .then(() => {
                alert("Course deleted successfully!");
                loadCourses();
            })
            .catch(err => alert("Error deleting course: " + err));
    }
}


/* =====================================================
   ALL REGISTRATIONS (Admin view)
===================================================== */
function loadRegistrations() {
    fetch("/teacher/registrations")
        .then(res => res.json())
        .then(data => renderRegistrationsTable(data.registrations || []));
}

function renderRegistrationsTable(regs) {
    if (!regs || regs.length === 0) {
        document.getElementById("tab-content").innerHTML = `
            <h3>No Registrations</h3>
            <p>No students have registered yet.</p>
        `;
        return;
    }

    let rows = regs.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${r.full_name || ''}</td>
            <td>${r.course_name || ''}</td>
            <td>${r.enrollment_status || ''}</td>
            <td>${r.payment_status || ''}</td>
            <td>${r.registered_at || ''}</td>
        </tr>
    `).join('');

    document.getElementById('tab-content').innerHTML = `
        <h3>All Registrations</h3>
        <table class="profile-table">
            <tr>
                <th>Sl No</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Enrollment Status</th>
                <th>Payment Status</th>
                <th>Registered At</th>
            </tr>
            ${rows}
        </table>
    `;
}

/* =====================================================
   TEACHERS MANAGEMENT (Admin Only)
===================================================== */

function loadTeachers() {
    fetch("/teacher/teachers")
        .then(res => res.json())
        .then(data => renderTeachersTable(data.teachers || []));
}

function renderTeachersTable(teachers) {
    let rows = teachers.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.full_name}</td>
            <td>${t.username}</td>
            <td>${t.email}</td>
            <td>${t.phone}</td>
            <td>${t.department}</td>
            <td>${t.specialization}</td>
            <td>
                <button class="delete-btn" onclick="deleteTeacher(${t.id})">🗑 Delete</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search teachers..." onkeyup="searchTable()">
            <button class="add-btn" onclick="openAddTeacher()">➕ Add Teacher</button>
        </div>
        <table class="profile-table" id="adminTable">
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Actions</th>
            </tr>
            ${rows || '<tr><td colspan="8">No teachers found</td></tr>'}
        </table>
    `;
}

function openAddTeacher() {
    const name = prompt("Enter Teacher Name:");
    if (!name) return;
    const username = prompt("Enter Username:");
    if (!username) return;
    const password = prompt("Enter Password:");
    if (!password) return;
    const email = prompt("Enter Email:");
    const phone = prompt("Enter Phone:");
    const gender = prompt("Enter Gender (Male/Female/Other):", "Male");
    const dept = prompt("Enter Department:");
    const spec = prompt("Enter Specialization:");
    const empId = prompt("Enter Employee ID:");
    const inst = prompt("Enter Institute Name:");

    fetch("/teacher/add-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name, username, password, email, phone, gender,
            department: dept, specialization: spec, employee_id: empId, institute: inst
        })
    }).then(() => loadTeachers());
}

function deleteTeacher(id) {
    if (confirm("Delete this teacher?")) {
        fetch("/teacher/delete-teacher/" + id, { method: "POST" })
            .then(() => loadTeachers());
    }
}

/* =====================================================
   DEPARTMENTS MANAGEMENT (Admin Only)
===================================================== */

function loadDepartments() {
    fetch("/teacher/departments")
        .then(res => res.json())
        .then(data => renderDepartmentsTable(data.departments || []));
}

function renderDepartmentsTable(deps) {
    let rows = deps.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.name}</td>
            <td>${d.dep_code}</td>
            <td>
                <button class="delete-btn" onclick="deleteDepartment(${d.id})">🗑 Delete</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search departments..." onkeyup="searchTable()">
            <button class="add-btn" onclick="openAddDepartment()">➕ Add Department</button>
        </div>
        <table class="profile-table" id="adminTable">
            <tr>
                <th>ID</th>
                <th>Department Name</th>
                <th>Code</th>
                <th>Actions</th>
            </tr>
            ${rows || '<tr><td colspan="4">No departments found</td></tr>'}
        </table>
    `;
}

function openAddDepartment() {
    const name = prompt("Enter Department Name:");
    if (!name) return;
    const code = prompt("Enter Department Code:");
    if (!code) return;

    fetch("/teacher/add-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code })
    }).then(() => loadDepartments());
}

function deleteDepartment(id) {
    if (confirm("Delete this department?")) {
        fetch("/teacher/delete-department/" + id, { method: "POST" })
            .then(() => loadDepartments());
    }
}

/* =====================================================
   PERFORMANCE TAB
===================================================== */

function loadPerformance() {
    fetch("/teacher/performance")
        .then(res => res.json())
        .then(data => renderPerformanceChart(data.performance || []));
}

function renderPerformanceChart(perf) {
    if (!perf || perf.length === 0) {
        document.getElementById("tab-content").innerHTML = `
            <h3>Department Performance</h3>
            <p>No performance data available yet. Ensure students have completed exams and teachers have published results.</p>
        `;
        return;
    }

    const labels = perf.map(p => p.full_name);
    const scores = perf.map(p => parseFloat(p.avg_score).toFixed(2));

    document.getElementById("tab-content").innerHTML = `
        <h3>Department Performance Overview</h3>
        <div class="card" style="margin-top:20px;">
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>
        <div style="margin-top:20px;">
            <h4>Rank List</h4>
            <table class="profile-table">
                <tr><th>Rank</th><th>Student Name</th><th>Avg Score</th></tr>
                ${perf.sort((a, b) => b.avg_score - a.avg_score).map((p, i) => `
                    <tr><td>${i + 1}</td><td>${p.full_name}</td><td>${parseFloat(p.avg_score).toFixed(2)}%</td></tr>
                `).join('')}
            </table>
        </div>
    `;

    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Score (%)',
                data: scores,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}
