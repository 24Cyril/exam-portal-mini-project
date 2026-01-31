// ===============================
// TAB SWITCH HANDLER
// ===============================
function openTab(tabName) {
    // Update title
    document.getElementById("page-title").innerText = tabName.toUpperCase();

    // Remove active from all tabs
    document.querySelectorAll(".sidebar li").forEach(tab => {
        tab.classList.remove("active");
    });

    // Add active to selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) activeTab.classList.add("active");

    // Load content
    if (tabName === "profile") {
        loadProfile();
    } else {
        document.getElementById("tab-content").innerHTML =
            `<h3>${tabName} section coming soon...</h3>`;
    }
}

// ===============================
// LOAD PROFILE CONTENT
// ===============================
function loadProfile() {
    document.getElementById("tab-content").innerHTML = `
        <div class="profile-wrapper">

            <div class="profile-left">
                <img src="../static/images/profile.png" alt="Profile">
                <h3>Student Profile</h3>
                <p>Profile details not added</p>
            </div>

            <div class="profile-right">

                <div class="profile-section">
                    <h4>Personal Details</h4>
                    <div class="profile-grid">
                        <div class="profile-item"><label>First Name</label><span></span></div>
                        <div class="profile-item"><label>Last Name</label><span></span></div>
                        <div class="profile-item"><label>Date of Birth</label><span></span></div>
                        <div class="profile-item"><label>Age</label><span></span></div>
                        <div class="profile-item"><label>Gender</label><span></span></div>
                        <div class="profile-item"><label>Blood Group</label><span></span></div>
                    </div>
                </div>

                <div class="profile-section">
                    <h4>Academic Details</h4>
                    <div class="profile-grid">
                        <div class="profile-item"><label>Course</label><span></span></div>
                        <div class="profile-item"><label>Year</label><span></span></div>
                        <div class="profile-item"><label>Semester</label><span></span></div>
                        <div class="profile-item"><label>CGPA</label><span></span></div>
                        <div class="profile-item"><label>Institute Name</label><span></span></div>
                    </div>
                </div>

                <div class="profile-section">
                    <h4>Contact Details</h4>
                    <div class="profile-grid">
                        <div class="profile-item"><label>Email</label><span></span></div>
                        <div class="profile-item"><label>Phone</label><span></span></div>
                        <div class="profile-item"><label>Address</label><span></span></div>
                        <div class="profile-item"><label>District</label><span></span></div>
                    </div>
                </div>

                <div class="profile-section">
                    <h4>Guardian Details</h4>
                    <div class="profile-grid">
                        <div class="profile-item"><label>Guardian Name</label><span></span></div>
                        <div class="profile-item"><label>Relation</label><span></span></div>
                        <div class="profile-item"><label>Contact</label><span></span></div>
                        <div class="profile-item"><label>Occupation</label><span></span></div>
                    </div>
                </div>

                <div class="profile-actions">
                    <a href="/editpro" class="edit-btn">➕ Add / Edit Profile</a>
                </div>

            </div>
        </div>
    `;
}

// ===============================
// AUTO LOAD PROFILE ON PAGE LOAD
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    openTab("profile");
});
