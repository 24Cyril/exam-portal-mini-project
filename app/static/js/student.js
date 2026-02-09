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

    if (tabName === "profile") loadProfile();
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
// COURSES (unchanged)
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
        container.innerHTML += `
            <div class="course-card">
                <img src="../static/images/course.png">
                <h4>${c.course_name}</h4>
                <p>${c.description}</p>
                <p><b>Duration:</b> ${c.duration}</p>
                <p><b>Fee:</b> ₹${c.fee}</p>
                <span class="badge ${c.status === "Active" ? "active" : "inactive"}">
                    ${c.status}
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

    if (search)
        filtered = filtered.filter(c => c.course_name.toLowerCase().includes(search));

    if (status)
        filtered = filtered.filter(c => c.status === status);

    if (sort === "az") filtered.sort((a,b)=>a.course_name.localeCompare(b.course_name));
    if (sort === "za") filtered.sort((a,b)=>b.course_name.localeCompare(a.course_name));

    renderCourses(filtered);
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
// CERTIFICATES + PAYMENTS (unchanged)
// ===============================
function loadCertificates(){ document.getElementById("tab-content").innerHTML="<h3>Certificates</h3>"; }
// ===============================
// PAYMENTS
// ===============================
function loadPayments() {

    fetch("/api/student/payments")
        .then(res => res.json())
        .then(data => {

            if (!data.length) {
                document.getElementById("tab-content").innerHTML =
                    "<h3>No payment records found</h3>";
                return;
            }

            let rows = data.map((p, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.course_name}</td>
                    <td>₹${p.amount}</td>
                    <td>${p.payment_method || "-"}</td>
                    <td>${p.transaction_id || "-"}</td>
                   <td>
    ${
        p.payment_status === "Pending"
        ? `<button class="pay-btn" onclick="payNow(${p.course_id}, ${p.amount})">Pay Now</button>`
        : `<span class="status done">Verified</span>`
    }
</td>

                    <td>${p.payment_date}</td>
                </tr>
            `).join("");

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

function payNow(courseId, amount) {

    fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, amount: amount })
    })
    .then(res => res.json())
    .then(order => {

        const options = {
            key: order.key, // Razorpay TEST key
            amount: order.amount,
            currency: "INR",
            name: "Exam Portal",
            description: "Course Registration Fee",
            order_id: order.order_id,

            handler: function (response) {
                fetch("/api/payment/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(response)
                }).then(() => {
                    alert("Payment Successful!");
                    loadPayments();
                });
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    });
}








// ===============================
// DEFAULT LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    openTab("profile");
});
