const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", function (e) {
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    e.preventDefault();
    alert("Passwords do not match!");
  }
});
