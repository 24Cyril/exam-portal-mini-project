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
    } else if (tabName === "courses") {
        loadCourses();
    } else {
        document.getElementById("tab-content").innerHTML =
            `<h3>${tabName} section coming soon...</h3>`;
    }
}

// ===============================
// LOAD PROFILE
// ===============================
function loadProfile() {
    document.getElementById("tab-content").innerHTML = `
        <p>Profile loaded (same as before)</p>
    `;
}

// ===============================
// LOAD COURSES
// ===============================
function loadCourses() {
    document.getElementById("tab-content").innerHTML = `
        <div class="courses-header">
            <input type="text" id="searchInput" placeholder="Search courses..." onkeyup="searchCourses()">
            <button onclick="toggleFilter()">🔍 Filter</button>
        </div>

        <div id="filterPanel" class="filter-panel hidden">
            <select id="semesterFilter" onchange="applyFilters()">
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
            </select>

            <select id="statusFilter" onchange="applyFilters()">
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
            </select>

            <select id="registerFilter" onchange="applyFilters()">
                <option value="">All</option>
                <option value="registered">Registered</option>
                <option value="not">Not Registered</option>
            </select>

            <select id="sortFilter" onchange="applyFilters()">
                <option value="">Sort</option>
                <option value="az">A - Z</option>
            </select>
        </div>

        <div class="courses-grid" id="coursesGrid"></div>
    `;

    renderCourses();
}

// ===============================
// SAMPLE COURSE DATA
// ===============================
const courses = [
    { name: "Data Structures", sem: "3", status: "completed", registered: true, img: "course1.jpg" },
    { name: "Database Systems", sem: "3", status: "incomplete", registered: true, img: "course2.jpg" },
    { name: "Python Programming", sem: "2", status: "completed", registered: false, img: "course3.jpg" },
    { name: "Web Development", sem: "1", status: "incomplete", registered: true, img: "course4.jpg" }
];

// ===============================
// RENDER COURSES
// ===============================
function renderCourses(filtered = courses) {
    const grid = document.getElementById("coursesGrid");
    grid.innerHTML = "";

    filtered.forEach(course => {
        grid.innerHTML += `
            <div class="course-card">
                <img src="../static/images/${course.img}">
                <h4>${course.name}</h4>
                <p>Semester ${course.sem}</p>
                <span class="${course.status}">${course.status}</span>
            </div>
        `;
    });
}

// ===============================
// SEARCH
// ===============================
function searchCourses() {
    const text = document.getElementById("searchInput").value.toLowerCase();
    const filtered = courses.filter(c => c.name.toLowerCase().includes(text));
    renderCourses(filtered);
}

// ===============================
// FILTER PANEL
// ===============================
function toggleFilter() {
    document.getElementById("filterPanel").classList.toggle("hidden");
}

function applyFilters() {
    let result = [...courses];

    const sem = document.getElementById("semesterFilter").value;
    const status = document.getElementById("statusFilter").value;
    const reg = document.getElementById("registerFilter").value;
    const sort = document.getElementById("sortFilter").value;

    if (sem) result = result.filter(c => c.sem === sem);
    if (status) result = result.filter(c => c.status === status);
    if (reg) result = result.filter(c => reg === "registered" ? c.registered : !c.registered);
    if (sort === "az") result.sort((a, b) => a.name.localeCompare(b.name));

    renderCourses(result);
}

// ===============================
// DEFAULT LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    openTab("profile");
});
