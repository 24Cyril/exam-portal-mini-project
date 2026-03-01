const studentForm = document.getElementById("studentForm");
const teacherForm = document.getElementById("teacherForm");
const adminForm = document.getElementById("adminForm");
const roleRadios = document.querySelectorAll("input[name='role']");

function updateRequiredFields(role) {
    // Reset all
    document.querySelectorAll(".form-section input, .form-section select, .form-section textarea").forEach(field => {
        field.required = false;
    });

    if (role === "student") {
        document.querySelector("input[name='s_full_name']").required = true;
        document.querySelector("input[name='age']").required = true;
        document.querySelector("select[name='gender']").required = true;
        document.querySelector("input[name='phone']").required = true;
    } else if (role === "teacher") {
        document.querySelector("input[name='full_name']").required = true;
        document.querySelector("select[name='tutor_gender']").required = true;
        document.querySelector("input[name='tutor_phone']").required = true;
        document.querySelector("input[name='department']").required = true;
    } else if (role === "admin") {
        document.querySelector("input[name='a_full_name']").required = true;
        document.querySelector("input[name='dob']").required = true;
        document.querySelector("select[name='a_gender']").required = true;
        document.querySelector("input[name='contact_number']").required = true;
    }
}

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

        updateRequiredFields(radio.value);
    });
});

// Initial required fields check for default selection (usually student)
const checkedRole = document.querySelector("input[name='role']:checked");
if (checkedRole) {
    updateRequiredFields(checkedRole.value);
}