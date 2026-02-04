document.getElementById("profileForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("/save-profile", {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(data => {
        document.getElementById("statusMsg").innerText = data;
    })
    .catch(err => {
        document.getElementById("statusMsg").innerText = "Error saving profile";
    });
});
