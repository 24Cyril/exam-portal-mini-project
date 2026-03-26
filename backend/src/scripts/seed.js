import {db} from '../config/firebase.js';

/*const courses = [
{
name: "Data Structures",
department: "Computer Science",
description: "Stacks, Queues, Trees",
fee: 500,
status: "Active",
createdBy: "admin1",
code: "CS101"
},
{
name: "Operating Systems",
department: "Computer Science",
description: "Processes, Threads, Scheduling",

status: "Active",
createdBy: "admin1",code: "CS102",
fee: 600
},
{
name: "Thermodynamics",
department: "Mechanical Engineering",
description: "Energy systems",
status: "Active",
createdBy: "admin1",code: "ME101",
fee: 550
},
{
name: "Machine Design",
department: "Mechanical Engineering",
description: "Design of mechanical elements",
status: "Active",
createdBy: "admin1",code: "ME102",
fee: 650
}
];

async function seedCourses(){
for(const course of courses){
await db.collection('courses').add(course);
}
console.log("Courses seeded");
}

seedCourses();
*/

const studenty=[
    {
        full_name:"alex",
        username:"alex",
        email:"alex@gmail.com",
        department_id:"Computer Science",
        department:"cs",
        roll_number:"CS2023001",
        role:"Student"

    }
];


async function seedCourses(){
for(const course of studenty){
await db.collection('users').add(course);
}
console.log("Users seeded");
}

seedCourses();