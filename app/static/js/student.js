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

    if (tabName === "profile") {
        loadProfile();
    }
    else if (tabName === "payment") {
        loadPayments();
    }
    
    else if (tabName === "courses") {
        loadCourses();
    }
    else if (tabName === "exam") {
        loadExams();
    }
    else if (tabName === "result") {
        loadResults();
    }
    else if (tabName === "certificate") {
        loadCertificates();
    }
    else {
        document.getElementById("tab-content").innerHTML =
            `<h3>${tabName} section coming soon...</h3>`;
    }
}

// ===============================
// LOAD PROFILE
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
            <tr><td>Year of Study</td><td>${data.year_of_study || "-"}</td></tr>
            <tr><td>Institute Name</td><td>${data.institute_name || "-"}</td></tr>
        </table>

        <a href="/editpro" class="update-btn">✏️ Update Profile</a>
    `;
}

// ===============================
// COURSES
// ===============================
let allCourses = [];

function loadCourses() {

    document.getElementById("tab-content").innerHTML = `
        <div class="card">

            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <input type="text" id="searchCourse" placeholder="Search course..." onkeyup="applyFilters()">

                <select id="sortCourse" onchange="applyFilters()">
                    <option value="">Sort</option>
                    <option value="az">A - Z</option>
                    <option value="za">Z - A</option>
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

    if (courses.length === 0) {
        container.innerHTML = "<p>No courses found.</p>";
        return;
    }

    courses.forEach(course => {
        container.innerHTML += `
            <div class="course-card">
                <img src="../static/images/course.png">
                <h4>${course.course_name}</h4>
                <p>${course.description}</p>
                <p><strong>Duration:</strong> ${course.duration}</p>
                <p><strong>Fee:</strong> ₹${course.fee}</p>
                <span class="badge ${course.status === "Active" ? "active" : "inactive"}">
                    ${course.status}
                </span>
            </div>
        `;
    });
}

function applyFilters() {

    let filtered = [...allCourses];

    const search = document.getElementById("searchCourse").value.toLowerCase();
    const sort = document.getElementById("sortCourse").value;
    const status = document.getElementById("statusFilter").value;

    if (search) {
        filtered = filtered.filter(c =>
            c.course_name.toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }

    if (sort === "az") {
        filtered.sort((a, b) => a.course_name.localeCompare(b.course_name));
    }

    if (sort === "za") {
        filtered.sort((a, b) => b.course_name.localeCompare(a.course_name));
    }

    renderCourses(filtered);
}

// ===============================
// EXAMS
// ===============================
function loadExams() {

    const exams = [
        {
            course: "Python Programming",
            duration: "2 Hours",
            date: "2026-03-10",
            attended: true,
            start: "10:00 AM",
            end: "12:00 PM"
        },
        {
            course: "Database Systems",
            duration: "1.5 Hours",
            date: "2026-02-25",
            attended: false,
            start: "09:00 AM",
            end: "10:30 AM"
        }
    ];

    exams.sort((a, b) => new Date(b.date) - new Date(a.date));

    let rows = exams.map((e, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${e.course}</td>
            <td>${e.duration}</td>
            <td>${e.date}</td>
            <td>
                <span class="attendance ${e.attended ? "yes" : "no"}">
                    ${e.attended ? "Attended" : "Not Attended"}
                </span>
            </td>
            <td>${e.start}</td>
            <td>${e.end}</td>
            <td>
                ${
                    e.attended
                    ? `<button class="result-btn">View Result</button>`
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
}

// ===============================
// RESULTS
// ===============================
function loadResults() {

    const results = [
        {
            course: "Python Programming",
            date: "2026-03-10",
            marks: 82,
            grade: "A",
            attended: true,
            status: "Pass"
        },
        {
            course: "Database Systems",
            date: "2026-02-25",
            marks: 0,
            grade: "-",
            attended: false,
            status: "Fail"
        }
    ];

    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    let rows = results.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${r.course}</td>
            <td>${r.date}</td>
            <td>${r.marks}</td>
            <td>${r.grade}</td>
            <td>
                <span class="attendance ${r.attended ? "yes" : "no"}">
                    ${r.attended ? "Attended" : "Not Attended"}
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
                        <th>Exam Date</th>
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
}

// ===============================
// CERTIFICATES
// ===============================
function loadCertificates() {

    const certificates = [
        {
            course: "Python Programming",
            issued_date: "2026-03-15",
            grade: "A",
            attended: true,
            file: "python_certificate.pdf"
        },
        {
            course: "Database Systems",
            issued_date: "2026-02-28",
            grade: "B",
            attended: true,
            file: "dbms_certificate.pdf"
        }
    ];

    certificates.sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date));

    let rows = certificates.map((c, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${c.course}</td>
            <td>${c.issued_date}</td>
            <td>${c.grade}</td>
            <td>
                <span class="attendance ${c.attended ? "yes" : "no"}">
                    ${c.attended ? "Attended" : "Not Attended"}
                </span>
            </td>
            <td>
                <a href="/certificates/${c.file}" class="result-btn" download>
                    Download
                </a>
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="table-wrapper">
            <h3>Certificates</h3>

            <table class="common-table">
                <thead>
                    <tr>
                        <th>Sl No</th>
                        <th>Course</th>
                        <th>Issued Date</th>
                        <th>Grade</th>
                        <th>Attendance</th>
                        <th>Certificate</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

// ===============================
// PAYMENTS
// ===============================
function loadPayments() {

    const payments = [
        {
            course: "Python Programming",
            type: "Course Registration",
            amount: 4500,
            date: "2026-01-15",
            status: "Paid"
        },
        {
            course: "Python Programming",
            type: "Exam Registration",
            amount: 800,
            date: "2026-03-05",
            status: "Pending"
        },
        {
            course: "Database Systems",
            type: "Course Registration",
            amount: 4000,
            date: "2026-01-20",
            status: "Paid"
        },
        {
            course: "Database Systems",
            type: "Exam Registration",
            amount: 700,
            date: "2026-02-18",
            status: "Paid"
        }
    ];

    // Sort by latest date
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));

    let rows = payments.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${p.course}</td>
            <td>${p.type}</td>
            <td>₹${p.amount}</td>
            <td>${p.date}</td>
            <td>
                <span class="status ${p.status === "Paid" ? "done" : "pending"}">
                    ${p.status}
                </span>
            </td>
            <td>
                ${
                    p.status === "Paid"
                    ? `<button class="result-btn">Receipt</button>`
                    : `<button class="attend-btn">Pay Now</button>`
                }
            </td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="table-wrapper">
            <h3>Payment Details</h3>

            <table class="common-table">
                <thead>
                    <tr>
                        <th>Sl No</th>
                        <th>Course</th>
                        <th>Payment Type</th>
                        <th>Amount</th>
                        <th>Payment Date</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

// ===============================
// DEFAULT LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    openTab("profile");
});
