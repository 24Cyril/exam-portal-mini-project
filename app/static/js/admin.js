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
        loadEnrollments();
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

    if (tabName === "student_courses") {
        loadRegistrations();
        return;
    }

    document.getElementById("tab-content").innerHTML =
        `<p>${tabName} module coming soon...</p>`;
}

function loadAdminHome() {
    Promise.all([
        fetch('/admin/students').then(r=>r.json()).then(d=>d.students||[]).catch(()=>[]),
        fetch('/admin/courses').then(r=>r.json()).then(d=>d.courses||[]).catch(()=>[]),
        fetch('/admin/enrollments').then(r=>r.json()).then(d=>d.enrollments||[]).catch(()=>[]),
        fetch('/admin/payments').then(r=>r.json()).then(d=>d.payments||[]).catch(()=>[])
    ]).then(([students, courses, enrollments, payments]) => {
        const totalStudents = (students || []).length;
        const totalCourses = (courses || []).length;
        const pendingEnrollments = (enrollments || []).length;
        const pendingPayments = (payments || []).filter(p => (p.payment_verification_status||'').toLowerCase() === 'submitted').length;
        const verifiedPayments = (payments || []).filter(p => (p.payment_verification_status||'').toLowerCase() === 'verified').length;

        document.getElementById('tab-content').innerHTML = `
            <div class="card admin-home">
                <h3>Admin Dashboard</h3>
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
    fetch("/admin/students")
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
    location.href = "/admin/add-student";
}

function editStudent(id) {
    location.href = "/admin/edit-student/" + id;
}

function deleteStudent(id) {
    if (confirm("Delete this student?")) {
        fetch("/admin/delete-student/" + id, { method: "POST" })
            .then(() => loadStudents());
    }
}

/* =====================================================
   COURSES TAB (NEW)
===================================================== */

function loadCourses() {
    fetch("/admin/courses")
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
    fetch("/admin/enrollments")
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
            <td><span class="badge pending">${e.enrollment_verification_status}</span></td>
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

    fetch(`/admin/enrollments/verify/${enrollmentId}`, { method: "POST" })
        .then(res => res.json())
        .then(() => {
            alert("Enrollment verified successfully!");
            loadEnrollments();
        })
        .catch(err => alert("Error: " + err));
}

function rejectEnrollment(enrollmentId) {
    if (!confirm("Reject this enrollment? Student will not be able to proceed.")) return;

    fetch(`/admin/enrollments/reject/${enrollmentId}`, { method: "POST" })
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
    fetch("/admin/payments")
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
            const hay = `${p.student_name||''} ${p.email||''} ${p.course_name||''} ${p.transaction_id||''}`.toLowerCase();
            ok = ok && hay.includes(q);
        }

        if (status) ok = ok && ((p.payment_verification_status||'').toString() === status);
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
    html += `<button ${paymentsCurrentPage===1? 'disabled' : ''} onclick="paymentsPrevPage()">Prev</button>`;
    for (let i=1;i<=pages;i++) html += `<button class="${i===paymentsCurrentPage?'active':''}" onclick="paymentsGoTo(${i})">${i}</button>`;
    html += `<button ${paymentsCurrentPage===pages? 'disabled' : ''} onclick="paymentsNextPage()">Next</button>`;
    html += `</div><div class="pagination-info">Showing ${start+1}-${Math.min(start+paymentsPageSize,total)} of ${total}</div>`;

    pager.innerHTML = html;

    const wrapper = document.getElementById('paymentsTableWrapper');
    wrapper.appendChild(pager);
}

function paymentsPrevPage(){ if(paymentsCurrentPage>1){ paymentsCurrentPage--; renderPaymentsPage(); } }
function paymentsNextPage(){ paymentsCurrentPage++; renderPaymentsPage(); }
function paymentsGoTo(n){ paymentsCurrentPage = n; renderPaymentsPage(); }

function renderPaymentsTable(payments) {
    const rows = (payments||[]).map(p => {
        const status = (p.payment_verification_status||'').toString();

        // receipt button (always visible if payment exists)
        const receiptBtn = p.payment_id ? `<button class="edit-btn" onclick="window.open('/payment/receipt/${p.payment_id}','_blank')">Receipt</button>` : '';

        let action = '';
        if ((status||'').toLowerCase() === 'submitted') {
            action = `
                <button class="verify-btn" onclick="verifyPayment(${p.payment_id})">✓ Verify</button>
                <button class="reject-btn" onclick="rejectPayment(${p.payment_id})">✗ Reject</button>
                ${receiptBtn}
            `;
        } else {
            action = `${receiptBtn} <span class="badge ${status==='Verified'?'active':status==='Rejected'?'inactive':'pending'}">${status||'-'}</span>`;
        }

        return `
            <tr>
                <td>${p.payment_id}</td>
                <td>${p.student_name||''}</td>
                <td>${p.email||''}</td>
                <td>${p.course_name||''}</td>
                <td>₹${p.amount||''}</td>
                <td>${p.payment_method||''}</td>
                <td>${p.transaction_id||''}</td>
                <td>${p.payment_date||''}</td>
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
                <th>Method</th>
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
    fetch("/admin/exams")
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
    location.href = "/admin/add-exam";
}

function deleteExam(id) {
    if (confirm("Delete this exam?")) {
        fetch("/admin/delete-exam/" + id, { method: "POST" })
            .then(() => loadExams());
    }
}

/* =====================================================
   REGISTRATIONS (STUDENT COURSES) TAB
===================================================== */

function loadRegistrations() {
    fetch("/admin/registrations")
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



function addCourse(){
    location.href="/admin/add-course";
}

function editCourse(id){
    location.href="/admin/edit-course/"+id;
}

function deleteCourse(id){
    if(confirm("Delete this course? This will also remove all enrollments and payments associated with it.")){
        fetch("/admin/delete-course/"+id,{method:"POST"})
            .then(res => res.json())
            .then(() => {
                alert("Course deleted successfully!");
                loadCourses();
            })
            .catch(err => alert("Error deleting course: " + err));
    }
}