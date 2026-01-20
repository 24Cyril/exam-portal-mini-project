function openTab(tabName) {
    document.getElementById("tab-title").innerText = tabName.toUpperCase();

    let content = "";

    if (tabName === "profile") {
        content = `
        <div class="admin-profile">

            <h3>Admin Profile</h3>

            <h4>Personal Details</h4>
            <table class="profile-table">
                <tr><td>Full Name</td><td>System Administrator</td></tr>
                <tr><td>Date of Birth</td><td>01-01-1990</td></tr>
                <tr><td>Gender</td><td>Not Specified</td></tr>
                <tr><td>Contact Number</td><td>+91 XXXXXXXXXX</td></tr>
                <tr><td>Email</td><td>admin@examportal.com</td></tr>
            </table>

            <h4>Account Information</h4>
            <table class="profile-table">
                <tr><td>Admin ID</td><td>ADM001</td></tr>
                <tr><td>Username</td><td>admin</td></tr>
                <tr><td>Role</td><td>System Administrator</td></tr>
                <tr><td>Account Status</td><td>Active</td></tr>
            </table>

            <h4>Institution Details</h4>
            <table class="profile-table">
                <tr><td>Institute Name</td><td>XYZ Institute of Technology</td></tr>
                <tr><td>Institute Code</td><td>INST2025</td></tr>
                <tr><td>Institute Email</td><td>info@xyzinstitute.edu</td></tr>
            </table>

            <h4>Security Details</h4>
            <table class="profile-table">
                <tr><td>Last Login</td><td>Today, 10:45 AM</td></tr>
                <tr><td>Password Status</td><td>Encrypted</td></tr>
                <tr><td>Session Status</td><td>Active</td></tr>
            </table>

        </div>`;
    }

    else if (tabName === "settings") {
        content = `<p>System configuration and admin settings will appear here.</p>`;
    }

    else if (tabName === "permissions") {
        content = `<p>Manage roles and permissions for users.</p>`;
    }

    else if (tabName === "reports") {
        content = `<p>View exam, user activity, and payment reports.</p>`;
    }

    else if (tabName === "errors") {
        content = `<p>System error logs and debugging information.</p>`;
    }

    else if (tabName === "messages") {
        content = `<p>Admin inbox to communicate with students.</p>`;
    }

    else if (tabName === "notifications") {
        content = `<p>Create and manage system notifications.</p>`;
    }

    else {
        content = `<p>Section under development.</p>`;
    }

    document.getElementById("tab-content").innerHTML = content;
}

/* Load Profile by default */
window.onload = function () {
    openTab('profile');
};
