-- Sample Data for Exam Portal
-- This script populates the new schema with test data.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE users;
TRUNCATE TABLE department;
TRUNCATE TABLE branch;
TRUNCATE TABLE admin;
TRUNCATE TABLE teacher;
TRUNCATE TABLE student;
TRUNCATE TABLE course;
TRUNCATE TABLE exams;
SET FOREIGN_KEY_CHECKS = 1;
-- 1. Users (password: 'password123' for all)
INSERT INTO users (username, password, role)
VALUES (
        'superadmin',
        'pbkdf2:sha256:260000$somehash',
        'admin'
    ),
    (
        't_cs_head',
        'pbkdf2:sha256:260000$somehash',
        'teacher'
    ),
    (
        't_cyb_head',
        'pbkdf2:sha256:260000$somehash',
        'teacher'
    ),
    (
        's_alice',
        'pbkdf2:sha256:260000$somehash',
        'student'
    ),
    (
        's_bob',
        'pbkdf2:sha256:260000$somehash',
        'student'
    );
-- 2. Departments
INSERT INTO department (name, dep_code, created_by)
VALUES ('Computer Science', 'CS', 1),
    ('Cyber Security', 'CYB', 1);
-- 3. Branches
INSERT INTO branch (department_id, name, branch_code)
VALUES (1, 'CS Engineering', 'CSE'),
    (1, 'Software Engineering', 'SWE'),
    (2, 'Network Security', 'NS'),
    (2, 'Ethical Hacking', 'EH');
-- 4. Admin Profile
INSERT INTO admin (user_id, full_name, email, institute_name)
VALUES (
        1,
        'Main Admin',
        'admin@institute.com',
        'Pixel Institute of Technology'
    );
-- 5. Teacher Profiles
INSERT INTO teacher (
        user_id,
        department_id,
        full_name,
        email,
        employee_id
    )
VALUES (
        2,
        1,
        'Dr. Sarah Connor',
        'sarah.c@institute.com',
        'EMP001'
    ),
    (
        3,
        2,
        'Prof. Alan Turing',
        'alan.t@institute.com',
        'EMP002'
    );
-- 6. Student Profiles
INSERT INTO student (
        user_id,
        department_id,
        branch_id,
        full_name,
        roll_number,
        email
    )
VALUES (
        4,
        1,
        1,
        'Alice Smith',
        'R001',
        'alice@student.com'
    ),
    (
        5,
        2,
        3,
        'Bob Johnson',
        'R002',
        'bob@student.com'
    );
-- 7. Courses
INSERT INTO course (branch_id, course_name, course_code, fee)
VALUES (1, 'Data Structures', 'CS101', 500.00),
    (1, 'Operating Systems', 'CS102', 450.00),
    (3, 'Cryptography', 'CYB101', 600.00);
-- 8. Exams (Mock Example)
INSERT INTO exams (
        course_id,
        exam_name,
        exam_type,
        total_questions,
        passing_score,
        status,
        answer_key
    )
VALUES (
        1,
        'DS Mid-Term',
        'Main',
        50,
        40,
        'Upcoming',
        'abcdabccda...'
    ),
    (
        3,
        'Crypto Quiz',
        'Mock',
        10,
        5,
        'Live',
        'aabbccddaa'
    );