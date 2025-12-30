function openTab(tabName) {
    document.getElementById("page-title").innerText = tabName.toUpperCase();
    document.getElementById("tab-content").innerHTML = `<h3>Loading ${tabName}...</h3>`;
    
    // Here later you can fetch dynamic data from backend
    // Example: fetch(`/get-${tabName}`).then(...)
}
