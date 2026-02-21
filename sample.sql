
INSERT INTO courses (course_name, course_code, department, description, duration, fee, status, created_by) VALUES
('Python Programming', 'PY101', 'Engineering', 'Introduction to Python programming', '12 weeks', 500.00, 'Active', 1),
('Data Structures', 'DS101', 'Engineering', 'Data structures and algorithms', '12 weeks', 600.00, 'Active', 1);

INSERT INTO exams (course_id, exam_name, exam_type, total_questions, duration_minutes, passing_score, exam_date, created_by) VALUES
(1, 'Python Test Exam', 'Test', 20, 60, 60, '2024-03-15 10:00:00', 1),
(1, 'Python Main Exam', 'Main', 50, 120, 70, '2024-06-20 14:00:00', 1);

INSERT INTO notes (course_id, title, content, created_by) VALUES
(1, 'Python Basics', 'Introduction to Python syntax and data types', 1),
(1, 'Functions in Python', 'Understanding functions and modules', 1);