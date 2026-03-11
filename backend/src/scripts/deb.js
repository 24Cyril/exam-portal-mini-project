import { db } from '../config/firebase.js';

async function debugCourses() {

const snapshot = await db.collection("courses").get();

console.log("Total courses:", snapshot.size);
console.log("------------");

snapshot.forEach(doc => {

const data = doc.data();

console.log("Document ID:", doc.id);
console.log("Data:", data);
console.log("Title field:", data.title);
console.log("Course Code:", data.course_code);
console.log("Department:", data.department_id);

console.log("------------");

});

process.exit();
}

debugCourses();