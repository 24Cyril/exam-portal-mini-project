// ===============================
// TAB SWITCH HANDLER
// ===============================
function openTab(tabName) {

    document.getElementById("page-title").innerText = tabName.toUpperCase();

    document.querySelectorAll(".sidebar li").forEach(tab => {
        tab.classList.remove("active");
    });
if (tabName === "home") {
    document.getElementById("tab-content").innerHTML = `
        <h3>Student Dashboard</h3>
        <p>Welcome to the online exam portal.</p>

        <div style="display:flex; gap:15px; flex-wrap:wrap;">
            <button class="edit-btn">My Courses</button>
            <button class="edit-btn">Upcoming Exams</button>
            <button class="edit-btn">Results</button>
            <button class="edit-btn">Payments</button>
        </div>
    `;
    return;
}

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
// ===============================
// LOAD PROFILE CONTENT (ADMIN STYLE)
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

            <tr><td>Profile Created</td><td>${data.created_at || "-"}</td></tr>
            <tr><td>Last Updated</td><td>${data.updated_at || "-"}</td></tr>
        </table>

        <a href="/editpro" class="update-btn">✏️ Update Profile</a>
    `;
}

// ===============================
// DEFAULT LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    openTab("home");
});
