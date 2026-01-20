// ===============================
// SETTINGS PANEL
// ===============================
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");

settingsBtn.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

// ===============================
// ROLE SWITCHING
// ===============================
const studentTab = document.getElementById("studentTab");
const adminTab = document.getElementById("adminTab");
const roleInput = document.getElementById("role");

studentTab.addEventListener("click", () => {
  studentTab.classList.add("active");
  adminTab.classList.remove("active");
  roleInput.value = "student";
});

adminTab.addEventListener("click", () => {
  adminTab.classList.add("active");
  studentTab.classList.remove("active");
  roleInput.value = "admin";
});

// ===============================
// THEME SWITCH
// ===============================
const themeSelect = document.getElementById("themeSelect");

themeSelect.addEventListener("change", () => {
  document.body.classList.toggle("dark-mode", themeSelect.value === "Dark");
});
