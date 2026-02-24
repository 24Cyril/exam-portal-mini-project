const studentForm = document.getElementById("studentForm");
const teacherForm = document.getElementById("teacherForm");
const adminForm = document.getElementById("adminForm");
const roleRadios = document.querySelectorAll("input[name='role']");

roleRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        // Hide all forms first
        studentForm.classList.remove("active");
        teacherForm.classList.remove("active");
        adminForm.classList.remove("active");

        // Show the selected form
        if (radio.value === "student") {
            studentForm.classList.add("active");
        } else if (radio.value === "teacher") {
            teacherForm.classList.add("active");
        } else if (radio.value === "admin") {
            adminForm.classList.add("active");
        }
    });
});