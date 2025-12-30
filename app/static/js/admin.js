function openTab(tabName) {
    document.getElementById("tab-title").innerText = tabName.toUpperCase();

    const sections = {
        profile: "Admin profile details and update form.",
        settings: "Portal configuration, system settings and preferences.",
        permissions: "Role access, allow/deny user features.",
        reports: "Analytics, exam performance, transaction and usage reports.",
        errors: "System errors, logs, and issue tracking.",
        messages: "Admin inbox - send & receive messages.",
        notifications: "Send alerts, announcements and updates."
    };

    document.getElementById("tab-content").innerHTML = `<p>${sections[tabName] || "Section under development"}</p>`;
}