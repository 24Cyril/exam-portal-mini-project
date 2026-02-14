function openTab(tab){

document.getElementById("tab-title").innerText = tab.toUpperCase();

/* PROFILE */
if(tab==="profile"){
document.getElementById("tab-content").innerHTML =
document.getElementById("profile-content").innerHTML;
return;
}

/* HOME */
if(tab==="home"){
document.getElementById("tab-content").innerHTML = `
<div class="home-row">
<div class="home-box">Permissions</div>
<div class="home-box">Reports</div>
<div class="home-box">Errors</div>
<div class="home-box">Messages</div>
<div class="home-box">Notifications</div>
</div>`;
return;
}

/* STUDENTS */
if(tab==="students"){
fetch("/admin/students")
.then(r=>r.json())
.then(d=>{
renderStudentsTable(d.students);
});
return;
}

/* COURSES */
if(tab==="courses"){
fetch("/admin/courses")
.then(r=>r.json())
.then(d=>renderCoursesTable(d.courses));
return;
}

/* REGISTRATION */
if(tab==="registration"){
fetch("/admin/registrations")
.then(r=>r.json())
.then(d=>renderTable(d.registrations,
["full_name","course_name","enrollment_status","payment_status","registered_at"]));
return;
}

/* PAYMENT */
if(tab==="payment"){
fetch("/admin/payments")
.then(r=>r.json())
.then(d=>renderTable(d.payments,
["full_name","course_name","amount","payment_method","payment_status","payment_date"]));
return;
}

/* ✅ STUDENT COURSES (FIXED & WORKING) */
if(tab==="student_courses"){
fetch("/admin/registrations")
.then(r=>r.json())
.then(d=>renderTable(d.registrations,
["full_name","course_name","enrollment_status","payment_status","registered_at"]));
return;
}

/* EXAM */
if(tab==="exam"){
document.getElementById("tab-content").innerHTML =
`<p>Exam scheduling & management coming soon</p>`;
return;
}

/* RESULT */
if(tab==="result"){
document.getElementById("tab-content").innerHTML =
`<p>Result publishing module coming soon</p>`;
return;
}

/* QUESTION */
if(tab==="question"){
document.getElementById("tab-content").innerHTML =
`<p>Upload Question Papers (PDF / DOC)</p>`;
return;
}

/* SHEET */
if(tab==="sheet"){
document.getElementById("tab-content").innerHTML =
`<p>Upload Answer Sheets</p>`;
return;
}
}


/* ================= GENERIC TABLE ================= */

function renderTable(data,fields){
let h = fields.map((f,i)=>`<th onclick="sortTable(${i})">${f.replace("_"," ").toUpperCase()}</th>`).join("");
let r = data.map(x=>`<tr>${fields.map(f=>`<td>${x[f]||""}</td>`).join("")}</tr>`).join("");

document.getElementById("tab-content").innerHTML = `
<div class="search-box">
<input id="searchInput" placeholder="Search..." onkeyup="searchTable()">
</div>
<table class="profile-table" id="adminTable">
<tr>${h}</tr>${r}
</table>`;
}


/* ================= COURSES ================= */

function renderCoursesTable(c){
let r = c.map(x=>`
<tr>
<td>${x.course_id}</td>
<td>${x.course_name}</td>
<td>${x.course_code}</td>
<td>${x.duration||""}</td>
<td>${x.fee}</td>
<td>${x.status}</td>
<td>
<button onclick="editCourse(${x.course_id})">Edit</button>
<button onclick="deleteCourse(${x.course_id})">Delete</button>
</td>
</tr>`).join("");

document.getElementById("tab-content").innerHTML = `
<div class="search-box">
<input id="searchInput" placeholder="Search..." onkeyup="searchTable()">
<button onclick="addCourse()">Add Course</button>
</div>
<table class="profile-table" id="adminTable">
<tr>
<th>ID</th><th>Name</th><th>Code</th><th>Duration</th><th>Fee</th><th>Status</th><th>Action</th>
</tr>${r}
</table>`;
}


/* ================= SEARCH ================= */

function searchTable(){
let v=document.getElementById("searchInput").value.toLowerCase();
document.querySelectorAll("#adminTable tr").forEach((r,i)=>{
if(i===0)return;
r.style.display=r.innerText.toLowerCase().includes(v)?"":"none";
});
}


/* ================= SORT ================= */

function sortTable(c){
let t=document.getElementById("adminTable");
let r=[...t.rows].slice(1);
r.sort((a,b)=>a.cells[c].innerText.localeCompare(b.cells[c].innerText));
r.forEach(x=>t.appendChild(x));
}


/* ================= COURSE ACTIONS ================= */

function addCourse(){location.href="/admin/add-course";}
function editCourse(id){location.href="/admin/edit-course/"+id;}
function deleteCourse(id){
if(confirm("Delete?")){
fetch("/admin/delete-course/"+id,{method:"POST"}).then(()=>openTab("courses"));
}
}

function renderStudentsTable(data){

let rows = data.map(s=>`
<tr>
<td>${s.id}</td>
<td>${s.full_name}</td>
<td>${s.email}</td>
<td>${s.phone || ""}</td>
<td>${s.gender || ""}</td>
<td>${s.course || ""}</td>
<td>${s.department || ""}</td>
<td>${s.year_of_study || ""}</td>
<td>
<button class="edit-btn" onclick="editStudent(${s.id})">✏ Edit</button>
<button class="delete-btn" onclick="deleteStudent(${s.id})">🗑 Delete</button>
</td>
</tr>
`).join("");

document.getElementById("tab-content").innerHTML = `
<div class="search-box">
<input placeholder="Search..." onkeyup="searchTable()">
<button class="add-btn" onclick="openAddStudent()">➕ Add Student</button>
</div>

<table class="profile-table" id="adminTable">
<tr>
<th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Gender</th>
<th>Course</th><th>Dept</th><th>Year</th><th>Action</th>
</tr>
${rows}
</table>`;
}

function openAddStudent(){
location.href="/admin/add-student";
}

function editStudent(id){
location.href="/admin/edit-student/"+id;
}

function openAddStudent(){
window.location.href="/admin/add-student";
}


window.onload=()=>openTab("home");
function deleteStudent(id){
    if(confirm("Delete this student?")){
        fetch("/admin/delete-student/" + id, {method:"POST"})
        .then(()=>openTab("students"));
    }
}

