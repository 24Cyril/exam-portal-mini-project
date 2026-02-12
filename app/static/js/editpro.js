document.addEventListener("DOMContentLoaded", () => {

    // 🔹 Load existing profile data
    fetch("/api/student/profile")
        .then(res => res.json())
        .then(data => {
            if (!data) return;

            document.querySelector('[name="full_name"]').value = data.full_name || "";
            document.querySelector('[name="age"]').value = data.age || "";
            document.querySelector('[name="gender"]').value = data.gender || "";
            document.querySelector('[name="email"]').value = data.email || "";
            document.querySelector('[name="phone"]').value = data.phone || "";
            document.querySelector('[name="address"]').value = data.address || "";
            document.querySelector('[name="course"]').value = data.course || "";
            document.querySelector('[name="department"]').value = data.department || "";
            document.querySelector('[name="institute_name"]').value = data.institute_name || "";
            document.querySelector('[name="year_of_study"]').value = data.year_of_study || "";
        });

    // 🔹 Save profile
    document.getElementById("profileForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(this);

        fetch("/save-profile", {
            method: "POST",
            body: formData
        })
        .then(res => res.text())
        .then(msg => {
            document.getElementById("statusMsg").innerText = msg;
        })
        .catch(() => {
            document.getElementById("statusMsg").innerText = "Error saving profile";
        });
    });
});


function goBackToProfile(){
    window.location.href="/student?tab=profile";
}