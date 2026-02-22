const studentForm = document.getElementById("studentForm");
const tutorForm = document.getElementById("tutorForm");
const roleRadios = document.querySelectorAll("input[name='role']");

roleRadios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "student") {
            studentForm.classList.add("active");
            tutorForm.classList.remove("active");
        } else {
            tutorForm.classList.add("active");
            studentForm.classList.remove("active");
        }
    });
});