function openTab(tabName) {
    document.getElementById("tab-title").innerText = tabName.toUpperCase();
    let content = "";

    if (tabName === "home") {
        content = `
            <h3>Admin Overview</h3>
            <div style="display:flex; gap:15px; flex-wrap:wrap;">
                <button class="update-btn">Permissions</button>
                <button class="update-btn">Reports</button>
                <button class="update-btn">Error Logs</button>
                <button class="update-btn">Messages</button>
                <button class="update-btn">Notifications</button>
            </div>
        `;
    }

    else if (tabName === "profile") {
        content = document.getElementById("profile-content").innerHTML;
    }
else if (tabName === "students") {
    loadStudents();
}
else if (tabName === "courses") loadCourses();

    else {
        content = `<p>Module under development.</p>`;
    }

    document.getElementById("tab-content").innerHTML = content;
}

function loadCourses() {
    fetch("/admin/courses")
        .then(r => r.json())
        .then(d => renderCourses(d.courses));
}

function renderCourses(courses) {

    let rows = courses.map(c => `
        <tr>
            <td>${c.course_id}</td>
            <td>${c.course_name}</td>
            <td>${c.course_code}</td>
            <td>${c.duration}</td>
            <td>${c.fee}</td>
            <td>${c.status}</td>
            <td>${c.created_at}</td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <input type="text" onkeyup="searchStudents()" placeholder="Search courses...">

        <table class="profile-table" id="studentTable">
            <tr>
                <th>ID</th>
                <th onclick="sortTable(1)">Name</th>
                <th>Code</th>
                <th>Duration</th>
                <th onclick="sortTable(4)">Fee</th>
                <th>Status</th>
                <th>Created</th>
            </tr>
            ${rows}
        </table>
    `;
}

function loadStudents() {
    fetch("/admin/students")
        .then(res => res.json())
        .then(data => renderStudentTable(data.students));
}
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
            <td>${s.age || ""}</td>
            <td>${s.gender || ""}</td>
            <td>${s.email || ""}</td>
            <td>${s.phone || ""}</td>
            <td>${s.address || ""}</td>
            <td>${s.course || ""}</td>
            <td>${s.department || ""}</td>
            <td>${s.institute_name || ""}</td>
            <td>${s.year_of_study || ""}</td>
            <td>${s.status || ""}</td>
            <td>${s.created_at || ""}</td>
        </tr>
    `).join("");

    document.getElementById("tab-content").innerHTML = `
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search students..." onkeyup="searchStudents()">

            <select id="courseFilter" onchange="filterStudents()">
                <option value="">All Courses</option>
                ${[...new Set(students.map(s => s.course).filter(Boolean))]
                    .map(c => `<option value="${c}">${c}</option>`).join("")}
            </select>
        </div>

        <table class="profile-table" id="studentTable">
            <tr>
                <th onclick="sortTable(0)">ID</th>
                <th onclick="sortTable(1)">Name</th>
                <th onclick="sortTable(2)">Age</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Course</th>
                <th>Department</th>
                <th>Institute</th>
                <th onclick="sortTable(10)">Year</th>
                <th>Status</th>
                <th>Created</th>
            </tr>
            ${rows}
        </table>
    `;
}




function searchStudents() {
    let input = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.querySelectorAll("#studentTable tr");

    rows.forEach((row, i) => {
        if (i === 0) return;
        row.style.display = row.innerText.toLowerCase().includes(input) ? "" : "none";
    });
}

function filterStudents() {
    let filter = document.getElementById("courseFilter").value;
    let rows = document.querySelectorAll("#studentTable tr");

    rows.forEach((row, i) => {
        if (i === 0) return;
        let course = row.children[3].innerText;
        row.style.display = (!filter || course === filter) ? "" : "none";
    });
}

function sortTable(colIndex) {
    let table = document.getElementById("studentTable");
    let rows = Array.from(table.rows).slice(1);

    rows.sort((a, b) =>
        a.cells[colIndex].innerText.localeCompare(b.cells[colIndex].innerText, undefined, {numeric: true})
    );

    rows.forEach(row => table.appendChild(row));
}

window.onload = function () {
    openTab("home");
};
