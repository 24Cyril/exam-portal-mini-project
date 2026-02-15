function openTab(tabName) {

    document.getElementById("tab-title").innerText = tabName.toUpperCase();

    if (tabName === "profile") {
        document.getElementById("tab-content").innerHTML =
            document.getElementById("profile-content").innerHTML;
        return;
    }

    if (tabName === "home") {
        document.getElementById("tab-content").innerHTML = `
            <h3>Admin Dashboard</h3>
            <p>Manage students, courses, registrations and payments from the sidebar.</p>
        `;
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
   PAYMENTS TAB
===================================================== */

function loadPayments() {
    fetch("/admin/payments")
        .then(res => res.json())
        .then(data => renderPaymentsTable(data.payments));
}

function renderPaymentsTable(payments) {

    if (!payments || payments.length === 0) {
        document.getElementById("tab-content").innerHTML = `
            <h3>No Pending Payments</h3>
            <p>All payment submissions have been processed.</p>
        `;
        return;
    }

    let rows = payments.map(p => `
        <tr>
            <td>${p.payment_id}</td>
            <td>${p.student_name || ""}</td>
            <td>${p.email || ""}</td>
            <td>${p.course_name}</td>
            <td>₹${p.amount || ""}</td>
            <td>${p.payment_method || ""}</td>
            <td>${p.transaction_id || ""}</td>
            <td><span class="badge pending">${p.payment_verification_status}</span></td>
            <td>${p.payment_date || ""}</td>
            <td>
                <button class="verify-btn" onclick="verifyPayment(${p.payment_id})">✓ Verify</button>
                <button class="reject-btn" onclick="rejectPayment(${p.payment_id})">✗ Reject</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <h3>Pending Payments</h3>
        <table class="profile-table">
            <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
            ${rows}
        </table>
    `;
}

function verifyPayment(paymentId) {
    if (!confirm("Verify this payment?")) return;

    fetch(`/admin/payments/verify/${paymentId}`, { method: "POST" })
        .then(res => res.json())
        .then(() => {
            alert("Payment verified successfully!");
            loadPayments();
        })
        .catch(err => alert("Error: " + err));
}

function rejectPayment(paymentId) {
    if (!confirm("Reject this payment? Student will need to resubmit.")) return;

    fetch(`/admin/payments/reject/${paymentId}`, { method: "POST" })
        .then(res => res.json())
        .then(() => {
            alert("Payment rejected!");
            loadPayments();
        })
        .catch(err => alert("Error: " + err));
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

window.onload = () => openTab("profile");
