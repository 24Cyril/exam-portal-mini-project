// ===============================
// SETTINGS PANEL TOGGLE
// ===============================
// ===============================
// SETTINGS PANEL TOGGLE (smooth)const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
  settingsPanel.classList.toggle("visible");
});



// ===============================
// LOGIN TAB SWITCHING
// ===============================
const studentTab = document.getElementById("studentTab");
const adminTab = document.getElementById("adminTab");

let currentRole = "student"; // default

studentTab.addEventListener("click", () => {
  if (!studentTab.classList.contains("active")) {
    studentTab.classList.add("active");
    adminTab.classList.remove("active");
    currentRole = "student";
  }
});

adminTab.addEventListener("click", () => {
  if (!adminTab.classList.contains("active")) {
    adminTab.classList.add("active");
    studentTab.classList.remove("active");
    currentRole = "admin";
  }
});
// ===============================
// LOGIN SUBMIT (TEMP)
// ===============================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  alert(`Logging in as ${currentRole.toUpperCase()}`);
});

// ===============================
// THEME SWITCH
// ===============================

const themeSelect = document.getElementById("themeSelect");

themeSelect.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", themeSelect.value === "Dark");
});
