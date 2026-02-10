function openTab(tabName){

document.getElementById("tab-title").innerText = tabName.toUpperCase();

/* PROFILE */
if(tabName==="profile"){
document.getElementById("tab-content").innerHTML =
document.getElementById("profile-content").innerHTML;
return;
}

/* HOME */
if(tabName==="home"){
document.getElementById("tab-content").innerHTML = `

<div class="home-tools">
<input placeholder="Search...">
<select><option>Sort By</option></select>
<select><option>Filter By</option></select>
</div>

<div class="home-row">
<div class="home-box">Permissions Management</div>
<div class="home-box">Reports & Analytics</div>
<div class="home-box">Error Logs</div>
<div class="home-box">Messages</div>
<div class="home-box">Notifications</div>
</div>
`;
return;
}

/* STUDENTS */
if(tabName==="students"){
fetch("/admin/students")
.then(res=>res.json())
.then(data=>{
renderTable(data.students,
["id","full_name","email","phone","gender","course","department","year_of_study","institute_name"]);
});
return;
}

/* COURSES */
if(tabName==="courses"){
fetch("/admin/courses")
.then(res=>res.json())
.then(data=>{
renderCoursesTable(data.courses);
});
return;
}

document.getElementById("tab-content").innerHTML =
`<p>${tabName} module coming soon...</p>`;
}


/* ===================== COURSES TABLE ===================== */

function renderCoursesTable(courses){

let rows = courses.map(c=>`
<tr>
<td>${c.course_id}</td>
<td>${c.course_name}</td>
<td>${c.course_code}</td>
<td>${c.duration || ""}</td>
<td>${c.fee}</td>
<td>${c.status}</td>
<td>
<button onclick="editCourse(${c.course_id})">✏ Edit</button>
<button onclick="deleteCourse(${c.course_id})">🗑 Delete</button>
</td>
</tr>
`).join("");

document.getElementById("tab-content").innerHTML = `

<div class="search-box">
<input id="searchInput" placeholder="Search courses..." onkeyup="searchTable()">
<button onclick="addCourse()">➕ Add Course</button>
</div>

<table class="profile-table" id="adminTable">
<tr>
<th onclick="sortTable(0)">ID</th>
<th onclick="sortTable(1)">Name</th>
<th>Code</th>
<th>Duration</th>
<th onclick="sortTable(4)">Fee</th>
<th>Status</th>
<th>Actions</th>
</tr>
${rows}
</table>
`;
}


/* ===================== GENERIC TABLE ===================== */

function renderTable(data,fields){

let header = fields.map((f,i)=>
`<th onclick="sortTable(${i})">${f.replace("_"," ").toUpperCase()}</th>`
).join("");

let rows = data.map(row=>`
<tr>
${fields.map(f=>`<td>${row[f]||""}</td>`).join("")}
</tr>
`).join("");

document.getElementById("tab-content").innerHTML = `
<div class="search-box">
<input id="searchInput" placeholder="Search..." onkeyup="searchTable()">
</div>

<table class="profile-table" id="adminTable">
<tr>${header}</tr>
${rows}
</table>
`;
}


/* ===================== SEARCH ===================== */

function searchTable(){
let v = document.getElementById("searchInput").value.toLowerCase();
let rows = document.querySelectorAll("#adminTable tr");

rows.forEach((r,i)=>{
if(i===0) return;
r.style.display = r.innerText.toLowerCase().includes(v) ? "" : "none";
});
}


/* ===================== SORT ===================== */

function sortTable(c){
let t = document.getElementById("adminTable");
let r = Array.from(t.rows).slice(1);

r.sort((a,b)=>
a.cells[c].innerText.localeCompare(b.cells[c].innerText,undefined,{numeric:true})
);

r.forEach(x=>t.appendChild(x));
}


/* ===================== COURSE ACTIONS ===================== */

function addCourse(){
window.location.href = "/admin/add-course";
}

function editCourse(id){
window.location.href = "/admin/edit-course/" + id;
}

function deleteCourse(id){
if(confirm("Delete this course?")){
fetch("/admin/delete-course/" + id,{method:"POST"})
.then(()=>openTab("courses"));
}
}

window.onload = ()=>openTab("home");
