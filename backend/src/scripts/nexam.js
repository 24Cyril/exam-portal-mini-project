import { db } from '../config/firebase.js';

const exams = [
{
title: "Data Structures Mock Test",
courseName: "Data Structures",
exam_type: "Mock",
timeInMinutes: 15,
passing_score: 40,
status: "Live",
questions: [
{
question: "Which data structure follows LIFO?",
option_a: "Queue",
option_b: "Stack",
option_c: "Array",
option_d: "Tree",
correctAnswer: "B",
marks: 1
},
{
question: "Which structure uses FIFO?",
option_a: "Queue",
option_b: "Stack",
option_c: "Tree",
option_d: "Graph",
correctAnswer: "A",
marks: 1
}
]
},

{
title: "Operating Systems Mock Test",
courseName: "Operating Systems",
exam_type: "Mock",
timeInMinutes: 15,
passing_score: 40,
status: "Live",
questions: [
{
question: "Which scheduling uses time slice?",
option_a: "FCFS",
option_b: "Round Robin",
option_c: "SJF",
option_d: "Priority",
correctAnswer: "B",
marks: 1
}
]
},

{
title: "Python Mock Test 2",
courseName: "Python Programming",
exam_type: "Mock",
timeInMinutes: 10,
passing_score: 50,
status: "Live",
questions: [
{
question: "Which keyword defines a function?",
option_a: "func",
option_b: "define",
option_c: "def",
option_d: "function",
correctAnswer: "C",
marks: 1
}
]
},

{
title: "Web Development Mock Test",
courseName: "Web Development",
exam_type: "Mock",
timeInMinutes: 10,
passing_score: 40,
status: "Live",
questions: [
{
question: "What does HTML stand for?",
option_a: "Hyper Text Markup Language",
option_b: "High Text Machine Language",
option_c: "Hyper Tool Markup Language",
option_d: "None",
correctAnswer: "A",
marks: 1
}
]
},
{
title: "Data Structures Mock Test 2",
courseName: "Data Structures",
exam_type: "Mock",
timeInMinutes: 20,
passing_score: 5,
status: "Live",
questions: [
{
question: "Which data structure uses FIFO?",
option_a: "Stack",
option_b: "Queue",
option_c: "Tree",
option_d: "Graph",
correctAnswer: "B",
marks: 1
},
{
question: "Which data structure uses LIFO?",
option_a: "Stack",
option_b: "Queue",
option_c: "Array",
option_d: "Graph",
correctAnswer: "A",
marks: 1
},
{
question: "Which structure is used for recursion?",
option_a: "Queue",
option_b: "Stack",
option_c: "Heap",
option_d: "Graph",
correctAnswer: "B",
marks: 1
},
{
question: "Binary tree has maximum how many children?",
option_a: "1",
option_b: "2",
option_c: "3",
option_d: "4",
correctAnswer: "B",
marks: 1
},
{
question: "Which traversal visits left-root-right?",
option_a: "Preorder",
option_b: "Postorder",
option_c: "Inorder",
option_d: "Level order",
correctAnswer: "C",
marks: 1
},
{
question: "Which data structure is best for BFS?",
option_a: "Stack",
option_b: "Queue",
option_c: "Tree",
option_d: "Array",
correctAnswer: "B",
marks: 1
},
{
question: "Which structure stores data hierarchically?",
option_a: "Array",
option_b: "Linked List",
option_c: "Tree",
option_d: "Queue",
correctAnswer: "C",
marks: 1
},
{
question: "Which structure uses nodes and pointers?",
option_a: "Array",
option_b: "Linked List",
option_c: "Stack",
option_d: "Queue",
correctAnswer: "B",
marks: 1
},
{
question: "Which traversal visits root first?",
option_a: "Preorder",
option_b: "Postorder",
option_c: "Inorder",
option_d: "Level order",
correctAnswer: "A",
marks: 1
},
{
question: "Heap is mainly used for?",
option_a: "Sorting",
option_b: "Searching",
option_c: "Memory",
option_d: "Recursion",
correctAnswer: "A",
marks: 1
}
]
}


];

async function seedExams(){

const snapshot = await db.collection("courses").get();

const courseMap = {};

snapshot.forEach(doc => {
const data = doc.data();

if(data.name){
courseMap[data.name] = doc.id;
}

});

console.log("Course Map:");
console.log(courseMap);
console.log("-------------------");

for(const exam of exams){

const courseId = courseMap[exam.courseName];

if(!courseId){
console.log("Course NOT found for:", exam.courseName);
continue;
}

const existing = await db.collection("exams")
.where("title","==",exam.title)
.where("courseId","==",courseId)
.get();

if(!existing.empty){
console.log("Skipping existing exam:", exam.title);
continue;
}

await db.collection("exams").add({
title: exam.title,
courseId: courseId,
createdAt: new Date().toISOString(),
createdBy: "system",
description: "",
exam_date: new Date().toISOString(),
exam_type: exam.exam_type,
passing_score: exam.passing_score,
questions: exam.questions,
status: exam.status,
timeInMinutes: exam.timeInMinutes,
total_questions: exam.questions.length
});

console.log("Inserted exam:", exam.title);

}

console.log("Exam seeding complete");
process.exit();
}

seedExams();