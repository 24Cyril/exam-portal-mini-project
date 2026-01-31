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

    else {
        content = `<p>Module under development.</p>`;
    }

    document.getElementById("tab-content").innerHTML = content;
}

window.onload = function () {
    openTab("home");
};
