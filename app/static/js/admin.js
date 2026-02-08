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
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput"
                   placeholder="Search students..."
                   onkeyup="searchTable()">
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
            </tr>
            ${rows}
        </table>
    `;
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
   DEFAULT TAB
===================================================== */

window.onload = () => openTab("profile");
