import mysql.connector
from flask import request, session

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
        use_pure=True
    )

# -------------------------------
# STUDENT PROFILE
# -------------------------------
def get_student_id(user_id):
    db = get_db_connection()
    cur = db.cursor()
    cur.execute("SELECT id FROM student WHERE user_id=%s", (user_id,))
    row = cur.fetchone()
    cur.close()
    db.close()
    return row[0] if row else None

def get_student_profile_by_username(username):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.*, u.username, d.name as department_name, b.name as branch_name
        FROM student s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN department d ON s.department_id = d.id
        LEFT JOIN branch b ON s.branch_id = b.id
        WHERE u.username = %s
    """, (username,))
    student = cursor.fetchone()
    cursor.close()
    db.close()
    if student:
        student['department'] = student['department_name']
        student['branch'] = student['branch_name']
    return student

def update_student_profile(user_id, data):
    db = get_db_connection()
    cur = db.cursor()
    cur.execute("""
        UPDATE student SET
            full_name=%s, email=%s, phone=%s, address=%s,
            dob=%s, blood_group=%s, nationality=%s,
            emergency_contact=%s, city=%s, state=%s,
            pincode=%s, country=%s
        WHERE user_id=%s
    """, (
        data["full_name"], data["email"], data["phone"], data["address"],
        data.get("dob"), data.get("blood_group"), data.get("nationality"),
        data.get("emergency_contact"), data.get("city"), data.get("state"),
        data.get("pincode"), data.get("country"), user_id
    ))
    db.commit()
    cur.close()
    db.close()

# -------------------------------
# COURSES & ENROLLMENT
# -------------------------------
def get_all_courses_for_student(student_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    # Fetch student's department and branch to filter courses
    cursor.execute("SELECT department_id, branch_id FROM student WHERE id = %s", (student_id,))
    s_info = cursor.fetchone()
    
    if not s_info:
        cursor.close()
        db.close()
        return []

    cursor.execute("""
        SELECT 
            c.course_id,
            c.course_name,
            c.course_code,
            c.fee,
            c.status as course_status,
            sc.status as enrollment_status,
            sc.updated_at as last_update
        FROM course c
        LEFT JOIN student_course sc ON c.course_id = sc.course_id AND sc.student_id = %s
        WHERE c.branch_id = %s
    """, (student_id, s_info['branch_id']))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data

def enroll_in_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()
    # Initial status is 'Pending'
    cur.execute("""
       INSERT IGNORE INTO student_course (student_id, course_id, status)
       VALUES (%s, %s, 'Pending')
    """, (student_id, course_id))
    db.commit()
    cur.close()
    db.close()

def unenroll_from_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()
    # Students can only unenroll if status is 'Pending' or 'Rejected'
    cur.execute("""
        DELETE FROM student_course
        WHERE student_id=%s AND course_id=%s AND status IN ('Pending', 'Rejected')
    """, (student_id, course_id))
    db.commit()
    cur.close()
    db.close()

# -------------------------------
# PAYMENTS
# -------------------------------
def submit_manual_payment(student_id, course_id, payment_type, transaction_id):
    db = get_db_connection()
    cur = db.cursor()
    
    # 1. Fetch amount from course
    cur.execute("SELECT fee FROM course WHERE course_id = %s", (course_id,))
    fee_row = cur.fetchone()
    amount = fee_row[0] if fee_row else 0.0

    # 2. Insert payment record
    cur.execute("""
        INSERT INTO payments (student_id, course_id, amount, transaction_id, payment_type, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
    """, (student_id, course_id, amount, transaction_id, payment_type))

    # 3. Update enrollment status to 'Payment_Submitted'
    cur.execute("""
        UPDATE student_course 
        SET status = 'Payment_Submitted' 
        WHERE student_id = %s AND course_id = %s
    """, (student_id, course_id))

    db.commit()
    cur.close()
    db.close()

def fetch_student_payments(student_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT p.*, c.course_name 
        FROM payments p
        JOIN course c ON p.course_id = c.course_id
        WHERE p.student_id = %s
        ORDER BY p.created_at DESC
    """, (student_id,))
    data = cur.fetchall()
    cur.close()
    db.close()
    return data

# -------------------------------
# EXAMS & NOTES
# -------------------------------
def fetch_student_exams(student_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            e.*, c.course_name,
            sub.score, sub.status as evaluation_status, sub.submitted_at
        FROM exams e
        JOIN course c ON e.course_id = c.course_id
        JOIN student_course sc ON sc.course_id = c.course_id
        LEFT JOIN student_exam_submissions sub ON sub.exam_id = e.exam_id AND sub.student_id = %s
        WHERE sc.student_id = %s AND sc.status = 'Enrolled_Active'
        AND e.status IN ('Upcoming', 'Live', 'Completed', 'Published')
    """, (student_id, student_id))
    exams = cursor.fetchall()
    cursor.close()
    db.close()
    return exams

def fetch_student_notes(student_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT n.*, c.course_name
        FROM notes n
        JOIN course c ON n.course_id = c.course_id
        JOIN student_course sc ON sc.course_id = c.course_id
        WHERE sc.student_id = %s AND sc.status = 'Enrolled_Active'
    """, (student_id,))
    notes = cursor.fetchall()
    cursor.close()
    db.close()
    return notes
