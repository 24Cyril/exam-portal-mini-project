-- Exam Portal Database Schema
-- MySQL Database for Exam Portal Mini Project
-- Users table for authentication
CREATE TABLE users (
    id INT(3) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

-- Admin table for admin users
CREATE TABLE admin (
    admin_id INT(3) AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    dob DATE,
    gender VARCHAR(10),
    contact_number VARCHAR(15),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Student table for student users
CREATE TABLE student (
    id INT(3) AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    course VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    institute_name VARCHAR(150) NOT NULL,
    year_of_study INT NOT NULL,
    enrollment_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Teachers table for teacher users
CREATE TABLE teacher (
    id INT(3) AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    age INT(3) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    institute_name VARCHAR(150) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    joining_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
create table department(
    id int(3) auto_increment primary key,
    name varchar(100),
    dep_code varchar(10),
    created_by int(3)
);
-- course table
CREATE TABLE course(
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    description TEXT,
    duration VARCHAR(50),
    fee DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Student course table (enrollment)
CREATE TABLE student_course (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_status ENUM('Enrolled', 'Unenrolled') DEFAULT 'Enrolled',
    enrollment_verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    payment_verification_status ENUM(
        'Not Required',
        'Pending',
        'Submitted',
        'Verified',
        'Rejected'
    ) DEFAULT 'Not Required',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_verified_at TIMESTAMP NULL,
    payment_verified_at TIMESTAMP NULL,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);
-- Payments table
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    amount DECIMAL(10, 2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    verification_status ENUM('Pending', 'Submitted', 'Verified', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);
-- Exams table
CREATE TABLE exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    exam_name VARCHAR(150) NOT NULL,
    exam_type ENUM('Test', 'Main', 'Mock') NOT NULL,
    total_questions INT NOT NULL,
    duration_minutes INT NOT NULL,
    passing_score INT NOT NULL,
    exam_date DATETIME NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE
    SET NULL
);
-- Questions table
CREATE TABLE exam_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option1 VARCHAR(255) NOT NULL,
    option2 VARCHAR(255) NOT NULL,
    option3 VARCHAR(255),
    option4 VARCHAR(255),
    correct_answer VARCHAR(255) NOT NULL,
    marks INT NOT NULL,
    question_order INT NOT NULL,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);
-- Student Exam Results table
CREATE TABLE student_exam_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    exam_id INT NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    status ENUM('Pass', 'Fail', 'Incomplete') NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);
-- Notes table
CREATE TABLE notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE
    SET NULL
);
-- Student Notes Access table
CREATE TABLE student_notes_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    note_id INT NOT NULL,
    access_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE
);
-- Student Performance table
CREATE TABLE student_performance (
    performance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    exam_id INT,
    performance_metric VARCHAR(100) NOT NULL,
    value DECIMAL(5, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE
    SET NULL
);
-- Teacher Student Progress table
CREATE TABLE teacher_student_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    progress_notes TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
);


--

