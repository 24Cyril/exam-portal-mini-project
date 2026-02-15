const registerForm = document.getElementById("registerForm");
const studentRadio = document.getElementById("student");
const adminRadio = document.getElementById("admin");
const studentFields = document.getElementById("studentFields");

// ------------------------------
// SHOW / HIDE STUDENT FIELDS
// ------------------------------
function toggleStudentFields() {
  if (studentRadio.checked) {
    studentFields.style.display = "block";
  } else {
    studentFields.style.display = "none";
  }
}

studentRadio.addEventListener("change", toggleStudentFields);
adminRadio.addEventListener("change", toggleStudentFields);

// default state
toggleStudentFields();

// ------------------------------
// PASSWORD MATCH CHECK
// ------------------------------
registerForm.addEventListener("submit", function (e) {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    e.preventDefault();
    alert("Passwords do not match!");
  }
});
