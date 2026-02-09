INSERT INTO student_courses (
    student_id, course_id, enrollment_status, payment_status
) VALUES
(1, 1, 'Enrolled', 'Paid'),
(1, 2, 'Enrolled', 'Pending');
(2, 1, 'Enrolled', 'Paid');


INSERT INTO courses (
    course_name, course_code, description,
    duration, fee, status, created_by
) VALUES
(
    'Python Programming',
    'PY101',
    'Introduction to Python programming',
    '3 Months',
    2500.00,
    'Active',
    1
),
(
    'Web Development',
    'WD201',
    'HTML, CSS, JavaScript & Flask',
    '4 Months',
    4000.00,
    'Active',
    1
);


INSERT INTO payments (
    student_id, course_id, amount,
    payment_method, transaction_id, payment_status
) VALUES
(
    1,
    1,
    2500.00,
    'Razorpay',
    'TXN123456',
    'Success'
),
(
    2,
    1,
    2500.00,
    'UPI',
    'TXN789012',
    'Success'
);


INSERT INTO exam_results (
    student_id, course_name, exam_date,
    marks, grade, attended, status
) VALUES
(
    1,
    'Python Programming',
    '2026-01-20',
    85,
    'A',
    'Attended',
    'Pass'
),
(
    3,
    'Python Programming',
    '2026-01-20',
    62,
    'B',
    'Attended',
    'Pass'
);


INSERT INTO payments (
    student_id,
    course_id,
    amount,
    payment_status
)
VALUES (
    1,        -- student id
    1,        -- course id
    5000.00,  -- amount
    'Pending'
);


card :

4242 4242 4242 4242
exp : 12/25
cvv : 123

otp: 123456