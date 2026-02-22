const studentForm = document.getElementById("studentForm");
const teacherForm = document.getElementById("teacherForm");
const roleRadios = document.querySelectorAll("input[name='role']");

roleRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "student") {
            studentForm.classList.add("active");
            teacherForm.classList.remove("active");
        } else {
            teacherForm.classList.add("active");
            studentForm.classList.remove("active");
        }
    });
});