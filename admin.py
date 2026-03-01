# ============================================================
# EXAM PORTAL DATABASE SCHEMA (MySQL)
# ------------------------------------------------------------
# This comment block documents the database structure used in
# the Exam Portal Mini Project. It is for reference only.
# Data types and variable sizes are intentionally omitted.
# ============================================================

# USERS
# - Stores authentication credentials for all users
# - Fields: id, username, password, role

# ADMIN
# - Stores admin profile details
# - Linked logically with users table
# - Fields: admin_id, full_name, dob, gender, contact_number,
#   email, username, institute_name, institute_code, institute_email,
#   last_login, created_at, updated_at

# STUDENT
# - Stores student profile information
# - Each student is linked to a user account
# - Fields: id, user_id, full_name, age, gender, email, phone,
#   address, course, department, institute_name, year_of_study,
#   enrollment_date, dob, blood_group, nationality, emergency_contact,
#   city, state, pincode, country, semester, roll_number,
#   created_at, updated_at

# TEACHER
# - Stores teacher profile information
# - Each teacher is linked to a user account
# - Fields: id, user_id, full_name, age, gender, email, phone,
#   address, department, specialization, institute_name,
#   employee_id, joining_date, created_at, updated_at

# COURSES
# - Stores course details created by admin
# - Fields: course_id, course_name, course_code, department,
#   description, duration, fee, status, created_by,
#   created_at, updated_at

# STUDENT_COURSES
# - Manages student enrollment into course
# - Tracks enrollment and payment verification status
# - Fields: id, student_id, course_id, enrollment_status,
#   enrollment_verification_status, payment_verification_status,
#   created_at, enrollment_verified_at, payment_verified_at

# PAYMENTS
# - Stores payment details for course enrollment
# - Fields: payment_id, student_id, course_id, amount,
#   payment_method, transaction_id, verification_status,
#   created_at

# EXAMS
# - Stores exams conducted for course
# - Fields: exam_id, course_id, exam_name, exam_type,
#   total_questions, duration_minutes, passing_score,
#   exam_date, question_file, answer_file, status,
#   created_by, created_at

# EXAM_QUESTIONS
# - Stores questions belonging to exams
# - Fields: question_id, exam_id, question_text,
#   option1, option2, option3, option4,
#   correct_answer, marks, question_order

# STUDENT_EXAM_RESULTS
# - Stores exam results of students
# - Fields: result_id, student_id, exam_id, score,
#   total_marks, percentage, status, attempted_at

# NOTES
# - Stores study notes for course
# - Fields: note_id, course_id, title, content,
#   created_by, created_at

# STUDENT_NOTES_ACCESS
# - Tracks which student accessed which note
# - Fields: id, student_id, note_id, access_date

# STUDENT_PERFORMANCE
# - Stores performance metrics of students
# - Fields: performance_id, student_id, course_id,
#   exam_id, performance_metric, value, recorded_at

# TEACHER_STUDENT_PROGRESS
# - Allows teachers to track student progress per course
# - Fields: progress_id, teacher_id, student_id,
#   course_id, progress_notes, last_updated

# ============================================================
# END OF DATABASE SCHEMA DOCUMENTATION
# ============================================================

import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
        use_pure=True,
        connection_timeout=5
    )

# -------------------------------
# FETCH ADMIN PROFILE
# -------------------------------
def get_admin_profile_by_username(username):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT *, contact_number as phone FROM admin WHERE username = %s",
        (username,)
    )

    admin = cursor.fetchone()

    cursor.close()
    db.close()
    return admin


# -------------------------------
# UPDATE ADMIN PROFILE
# -------------------------------
def update_admin_profile(username, data, new_password=None):
    db = get_db_connection()
    cursor = db.cursor()

    # Check if admin record exists
    cursor.execute("SELECT admin_id FROM admin WHERE username=%s", (username,))
    exists = cursor.fetchone()

    if exists:
        if new_password:
             cursor.execute("""
                UPDATE users u
                JOIN admin a ON a.username = u.username
                SET u.password = %s
                WHERE a.username = %s
            """, (new_password, username))

        cursor.execute("""
            UPDATE admin
            SET full_name=%s,
                dob=%s,
                gender=%s,
                contact_number=%s,
                email=%s,
                institute_name=%s,
                institute_code=%s,
                institute_email=%s
            WHERE username=%s
        """, (
            data["full_name"],
            data["dob"],
            data["gender"],
            data["contact_number"],
            data["email"],
            data["institute_name"],
            data["institute_code"],
            data["institute_email"],
            username
        ))
    else:
        # INSERT
        cursor.execute("""
            INSERT INTO admin (username, full_name, dob, gender, contact_number, email, institute_name, institute_code, institute_email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            username,
            data["full_name"],
            data["dob"],
            data["gender"],
            data["contact_number"],
            data["email"],
            data["institute_name"],
            data["institute_code"],
            data["institute_email"]
        ))
        
        if new_password:
             cursor.execute("""
                UPDATE users SET password = %s WHERE username = %s
            """, (new_password, username))

    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# FETCH ALL STUDENTS (ADMIN VIEW)
# -------------------------------
def get_all_students():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            s.id,
            s.full_name,
            s.email,
            s.phone,
            s.gender,
            s.course,
            s.department,
            s.year_of_study,
            s.institute_name,
            s.created_at
        FROM student s
        ORDER BY s.created_at DESC
    """)

    students = cursor.fetchall()
    cursor.close()
    db.close()

    return students

# -------------------------------
# FETCH ALL TEACHERS (ADMIN VIEW)
# -------------------------------
def get_all_teachers():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            t.id,
            t.full_name,
            t.email,
            t.phone,
            t.department,
            t.specialization,
            t.institute_name,
            t.created_at,
            u.username
        FROM teacher t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
    """)

    teachers = cursor.fetchall()
    cursor.close()
    db.close()

    return teachers

# -------------------------------
# GET TEACHER BY ID
# -------------------------------
def get_teacher_by_id(id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            t.id,
            t.full_name,
            t.email,
            t.phone,
            t.department,
            t.specialization,
            t.institute_name,
            u.username
        FROM teacher t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    """, (id,))

    teacher = cursor.fetchone()
    cursor.close()
    db.close()

    return teacher

# -------------------------------
# UPDATE TEACHER
# -------------------------------
def update_teacher(id, data):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE teacher t
        JOIN users u ON t.user_id = u.id
        SET 
            t.full_name = %s,
            t.email = %s,
            t.phone = %s,
            t.department = %s,
            t.specialization = %s,
            t.institute_name = %s
        WHERE t.id = %s
    """, (
        data["full_name"],
        data["email"],
        data["phone"],
        data["department"],
        data["specialization"],
        data["institute_name"],
        id
    ))

    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# DELETE TEACHER
# -------------------------------
def delete_teacher(id):
    db = get_db_connection()
    cursor = db.cursor()

    # Get user_id first to clean up users table too
    cursor.execute("SELECT user_id FROM teacher WHERE id = %s", (id,))
    row = cursor.fetchone()
    if row:
        user_id = row[0]
        cursor.execute("DELETE FROM teacher WHERE id = %s", (id,))
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))

    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# FETCH ALL COURSES (ADMIN VIEW)
# -------------------------------
def get_all_courses():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            c.course_id,
            c.course_name,
            c.course_code,
            c.department,
            c.description,
            c.duration,
            c.fee,
            c.status,
            c.created_at,
            a.full_name AS created_by_name
        FROM course c
        LEFT JOIN admin a ON c.created_by = a.admin_id
        ORDER BY c.created_at DESC
    """)

    course = cursor.fetchall()
    cursor.close()
    db.close()

    return course

# -------------------------------
# GET COURSES BY DEPARTMENT
# -------------------------------
def get_courses_by_department(department):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            c.course_id,
            c.course_name,
            c.course_code,
            c.department,
            c.description,
            c.duration,
            c.fee,
            c.status,
            c.created_at
        FROM course c
        WHERE c.department = %s
        ORDER BY c.created_at DESC
    """, (department,))

    course = cursor.fetchall()
    cursor.close()
    db.close()

    return course


# -------------------------------
# FETCH PENDING ENROLLMENTS
# -------------------------------
def get_pending_enrollments():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            sc.id,
            sc.student_id,
            s.full_name AS student_name,
            s.email,
            c.course_id,
            c.course_name,
            sc.enrollment_status,
            sc.enrollment_verification_status,
            sc.created_at
        FROM student_course sc
        JOIN student s ON sc.student_id = s.id
        JOIN course c ON sc.course_id = c.course_id
        WHERE sc.enrollment_verification_status = 'Pending'
        ORDER BY sc.created_at DESC
    """)

    enrollments = cursor.fetchall()
    cursor.close()
    db.close()

    return enrollments


# -------------------------------
# VERIFY ENROLLMENT
# -------------------------------
def verify_enrollment(enrollment_id):
    db = get_db_connection()
    cursor = db.cursor()

    # Update enrollment status to Verified and set payment status to Pending
    cursor.execute("""
        UPDATE student_course
        SET enrollment_verification_status = 'Verified',
            payment_verification_status = 'Pending'
        WHERE id = %s
    """, (enrollment_id,))

    # Get student_id and course_id to create payment record
    cursor.execute("""
        SELECT student_id, course_id
        FROM student_course
        WHERE id = %s
    """, (enrollment_id,))
    
    result = cursor.fetchone()
    if result:
        student_id, course_id = result
        
        # Create payment record
        cursor.execute("""
            INSERT INTO payments (student_id, course_id, amount, verification_status)
            SELECT %s, course_id, fee, 'Pending'
            FROM course
            WHERE course_id = %s
            ON DUPLICATE KEY UPDATE verification_status = 'Pending'
        """, (student_id, course_id))

    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# REJECT ENROLLMENT
# -------------------------------
def reject_enrollment(enrollment_id):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE student_course
        SET enrollment_verification_status = 'Rejected',
            payment_verification_status = 'Not Required'
        WHERE id = %s
    """, (enrollment_id,))

    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# FETCH PENDING PAYMENTS
# -------------------------------
def get_pending_payments():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.payment_id,
            p.student_id,
            s.full_name AS student_name,
            s.email,
            c.course_id,
            c.course_name,
            p.amount,
            p.payment_method,
            p.transaction_id,
            sc.payment_verification_status,
            DATE(p.payment_date) AS payment_date
        FROM payments p
        JOIN student s ON p.student_id = s.id
        JOIN course c ON p.course_id = c.course_id
        JOIN student_course sc ON sc.student_id = p.student_id AND sc.course_id = p.course_id
        WHERE sc.payment_verification_status = 'Submitted'
        ORDER BY p.payment_date DESC
    """)

    payments = cursor.fetchall()
    cursor.close()
    db.close()

    return payments


# -------------------------------
# FETCH ALL PAYMENTS (history)
# -------------------------------
def get_all_payments():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            p.payment_id,
            p.student_id,
            s.full_name AS student_name,
            s.email,
            c.course_id,
            c.course_name,
            p.amount,
            p.payment_method,
            p.transaction_id,
            -- prefer the payments table status for historical accuracy
            p.verification_status AS payment_verification_status,
            DATE(p.payment_date) AS payment_date
        FROM payments p
        JOIN student s ON p.student_id = s.id
        JOIN course c ON p.course_id = c.course_id
        ORDER BY p.payment_date DESC
    """)

    payments = cursor.fetchall()
    cursor.close()
    db.close()

    return payments


# -------------------------------
# FETCH SINGLE PAYMENT
# -------------------------------
def get_payment_by_id(payment_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            p.payment_id,
            p.student_id,
            s.full_name AS student_name,
            s.email,
            c.course_id,
            c.course_name,
            p.amount,
            p.payment_method,
            p.transaction_id,
            p.verification_status AS payment_verification_status,
            DATE(p.payment_date) AS payment_date
        FROM payments p
        JOIN student s ON p.student_id = s.id
        JOIN course c ON p.course_id = c.course_id
        WHERE p.payment_id = %s
    """, (payment_id,))

    payment = cursor.fetchone()
    cursor.close()
    db.close()
    return payment


# -------------------------------
# VERIFY PAYMENT
# -------------------------------
def verify_payment(payment_id):
    db = get_db_connection()
    cursor = db.cursor()

    # Get student_id and course_id from payment
    cursor.execute("""
        SELECT student_id, course_id
        FROM payments
        WHERE payment_id = %s
    """, (payment_id,))
    
    result = cursor.fetchone()
    if result:
        student_id, course_id = result
        
        # Update payment verification status in student_course
        cursor.execute("""
            UPDATE student_course
            SET payment_verification_status = 'Verified'
            WHERE student_id = %s AND course_id = %s
        """, (student_id, course_id))
        
        # Update payment verification status in payments table
        cursor.execute("""
            UPDATE payments
            SET verification_status = 'Verified'
            WHERE payment_id = %s
        """, (payment_id,))

    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# REJECT PAYMENT
# -------------------------------
def reject_payment(payment_id):
    db = get_db_connection()
    cursor = db.cursor()

    # Get student_id and course_id from payment
    cursor.execute("""
        SELECT student_id, course_id
        FROM payments
        WHERE payment_id = %s
    """, (payment_id,))
    
    result = cursor.fetchone()
    if result:
        student_id, course_id = result
        
        # Update payment verification status back to Pending
        cursor.execute("""
            UPDATE student_course
            SET payment_verification_status = 'Pending'
            WHERE student_id = %s AND course_id = %s
        """, (student_id, course_id))
        
        # Update payment verification status in payments table
        cursor.execute("""
            UPDATE payments
            SET verification_status = 'Rejected'
            WHERE payment_id = %s
        """, (payment_id,))

    db.commit()
    cursor.close()
    db.close()
  
# -------------------------------  
# FETCH ALL REGISTRATIONS  
# -------------------------------  
def get_all_registrations():  
    db = get_db_connection()  
    cursor = db.cursor(dictionary=True)  
    cursor.execute("""SELECT s.full_name, c.course_name, sc.enrollment_status, sc.payment_verification_status AS payment_status, sc.created_at AS registered_at FROM student_course sc JOIN student s ON sc.student_id=s.id JOIN course c ON sc.course_id=c.course_id ORDER BY sc.created_at DESC""")  
    data = cursor.fetchall()  
    cursor.close()  
    db.close()  
    return data 


# -------------------------------
# FETCH ALL REGISTRATIONS
# -------------------------------
def get_all_registrations():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""SELECT s.full_name, c.course_name, sc.enrollment_status, sc.payment_verification_status AS payment_status, sc.created_at AS registered_at FROM student_course sc JOIN student s ON sc.student_id=s.id JOIN course c ON sc.course_id=c.course_id ORDER BY sc.created_at DESC""")
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


# -------------------------------
# FETCH ALL EXAMS
# -------------------------------
def get_all_exams():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""SELECT e.exam_id,e.exam_name,c.course_name, e.exam_date,e.status,e.question_file,e.answer_file FROM exams e JOIN course c ON e.course_id=c.course_id ORDER BY e.exam_date DESC""")
    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


# -------------------------------
# ADD EXAM
# -------------------------------
def add_exam(name, course_id, date, qfile, afile):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""INSERT INTO exams(exam_name,course_id,exam_date,question_file,answer_file) VALUES(%s,%s,%s,%s,%s)""",(name, course_id, date, qfile, afile))
    db.commit()
    exam_id = cursor.lastrowid
    cursor.close()
    db.close()
    return exam_id


def update_exam_time_limit(exam_id, time_limit):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE exams SET time_limit=%s WHERE exam_id=%s", (time_limit, exam_id))
    db.commit()
    cursor.close()
    db.close()


def insert_exam_questions(exam_id, questions):
    """Insert parsed questions for an exam.
    questions: list of dicts with keys q_no, question, option_a..d, correct_option
    """
    db = get_db_connection()
    cursor = db.cursor()
    for q in questions:
        cursor.execute("""
            INSERT INTO exam_questions (exam_id, q_no, question, option_a, option_b, option_c, option_d, correct_option)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON DUPLICATE KEY UPDATE question=%s, option_a=%s, option_b=%s, option_c=%s, option_d=%s, correct_option=%s
        """, (
            exam_id, q['q_no'], q['question'], q.get('option_a'), q.get('option_b'), q.get('option_c'), q.get('option_d'), q.get('correct_option'),
            q['question'], q.get('option_a'), q.get('option_b'), q.get('option_c'), q.get('option_d'), q.get('correct_option')
        ))

    db.commit()
    cursor.close()
    db.close()


def get_exam_questions(exam_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT q_no, question, option_a, option_b, option_c, option_d FROM exam_questions WHERE exam_id=%s ORDER BY q_no ASC", (exam_id,))
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows


def create_attempt(student_id, exam_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("INSERT INTO student_attempts (student_id, exam_id) VALUES (%s,%s)", (student_id, exam_id))
    db.commit()
    attempt_id = cursor.lastrowid
    cursor.close()
    db.close()
    return attempt_id


def save_answer(attempt_id, q_no, selected_option):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO student_answers (attempt_id, q_no, selected_option)
        VALUES (%s,%s,%s)
        ON DUPLICATE KEY UPDATE selected_option=%s
    """, (attempt_id, q_no, selected_option, selected_option))
    db.commit()
    cursor.close()
    db.close()


def submit_attempt(attempt_id, duration_seconds=0):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE student_attempts SET submitted_at=NOW(), duration_seconds=%s WHERE attempt_id=%s", (duration_seconds, attempt_id))
    db.commit()
    cursor.close()
    db.close()


def grade_attempt(attempt_id):
    """Compute score for attempt and update student_attempts.score and graded."""
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # fetch answers for attempt
    cursor.execute("SELECT q.q_no, q.correct_option, a.selected_option FROM exam_questions q JOIN student_attempts sa ON q.exam_id = sa.exam_id JOIN student_answers a ON a.q_no=q.q_no AND a.attempt_id=sa.attempt_id WHERE sa.attempt_id=%s", (attempt_id,))
    rows = cursor.fetchall()
    score = 0
    total = 0
    for r in rows:
        total += 1
        if r.get('selected_option') and r.get('correct_option') and r['selected_option'].strip().upper() == r['correct_option'].strip().upper():
            score += 1

    cursor.execute("UPDATE student_attempts SET score=%s, graded='Graded' WHERE attempt_id=%s", (score, attempt_id))
    db.commit()
    cursor.close()
    db.close()
    return {'score': score, 'total': total}


# -------------------------------
# DELETE EXAM
# -------------------------------
def delete_exam(exam_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("DELETE FROM exams WHERE exam_id=%s", (exam_id,))
    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# UPDATE STUDENT PASSWORD
# -------------------------------
from werkzeug.security import generate_password_hash

def update_student_password(user_id, password):
    db = get_db_connection()
    cursor = db.cursor()
    hashed = generate_password_hash(password)
    cursor.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, user_id))
    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# GET COURSE BY ID
# -------------------------------
def get_course_by_id(course_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM course WHERE course_id=%s", (course_id,))
    course = cursor.fetchone()
    cursor.close()
    db.close()
    return course


# -------------------------------
# ADD COURSE
# -------------------------------
def add_course(course_name, course_code, department, description, duration, fee, status, created_by):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO course
        (course_name, course_code, department, description, duration, fee, status, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (course_name, course_code, department, description, duration, fee, status, created_by))
    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# UPDATE COURSE
# -------------------------------
def update_course(course_id, course_name, course_code, department, description, duration, fee, status):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""
        UPDATE course
        SET course_name=%s,
            course_code=%s,
            department=%s,
            description=%s,
            duration=%s,
            fee=%s,
            status=%s
        WHERE course_id=%s
    """, (course_name, course_code, department, description, duration, fee, status, course_id))
    db.commit()
    cursor.close()
    db.close()


# -------------------------------
# DELETE COURSE
# -------------------------------
def delete_course(course_id):
    db = get_db_connection()
    cursor = db.cursor()
    # Foreign key constraints will cascade delete related records
    cursor.execute("DELETE FROM course WHERE course_id=%s", (course_id,))
    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# GET EXAM TIME LIMIT
# -------------------------------
def get_exam_time_limit(exam_id):
    db = get_db_connection()
    c = db.cursor()
    c.execute("SELECT time_limit FROM exams WHERE exam_id=%s", (exam_id,))
    row = c.fetchone()
    tl = 30
    if row and row[0]:
        tl = int(row[0])
    c.close()
    db.close()
    return tl

# -------------------------------
# GET STUDENT BY ID (ADMIN)
# -------------------------------
def get_student_by_id(student_id):
    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM student WHERE id=%s", (student_id,))
    student = c.fetchone()
    c.close()
    db.close()
    return student

# -------------------------------
# UPDATE STUDENT (ADMIN)
# -------------------------------
def update_student(student_id, data):
    db = get_db_connection()
    c = db.cursor()
    c.execute("""
        UPDATE student SET
        full_name=%s,
        email=%s,
        phone=%s,
        gender=%s,
        course=%s,
        department=%s,
        year_of_study=%s,
        age=%s,
        address=%s,
        institute_name=%s
        WHERE id=%s
    """, (
        data['full_name'],
        data['email'],
        data['phone'],
        data['gender'],
        data['course'],
        data['department'],
        data['year'],
        data.get('age', 0),
        data.get('address', ''),
        data.get('institute_name', ''),
        student_id
    ))
    db.commit()
    c.close()
    db.close()

# -------------------------------
# DELETE STUDENT (ADMIN)
# -------------------------------
def delete_student(student_id):
    db = get_db_connection()
    c = db.cursor()
    c.execute("SELECT user_id FROM student WHERE id=%s", (student_id,))
    result = c.fetchone()
    if result:
        user_id = result[0]
        c.execute("DELETE FROM student WHERE id=%s", (student_id,))
        c.execute("DELETE FROM users WHERE id=%s", (user_id,))
        db.commit()
    c.close()
    db.close()

# -------------------------------
# ADD STUDENT (ADMIN)
# -------------------------------
def add_student(username, password, name, email, phone, gender, course, department, year, age=0, address='', institute=''):
    db = get_db_connection()
    c = db.cursor()
    from werkzeug.security import generate_password_hash
    hashed_password = generate_password_hash(password)
    
    c.execute(
        "INSERT INTO users(username,password,role) VALUES(%s,%s,%s)",
        (username, hashed_password, 'student')
    )
    user_id = c.lastrowid
    
    c.execute("""
        INSERT INTO student
        (user_id, full_name, age, gender, email, phone, address, branch, department, institute_name, year_of_study, enrollment_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
    """, (user_id, name, age, gender, email, phone, address, course, department, institute, year))
    
    db.commit()
    c.close()
    db.close()


# -------------------------------
# DEPARTMENT MANAGEMENT
# -------------------------------
def add_department(name, code, created_by):
    db = get_db_connection()
    c = db.cursor()
    c.execute("INSERT INTO department (name, dep_code, created_by) VALUES (%s, %s, %s)", (name, code, created_by))
    db.commit()
    c.close()
    db.close()

def get_all_departments():
    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM department ORDER BY id DESC")
    deps = c.fetchall()
    c.close()
    db.close()
    return deps

def delete_department(dep_id):
    db = get_db_connection()
    c = db.cursor()
    c.execute("DELETE FROM department WHERE id = %s", (dep_id,))
    db.commit()
    c.close()
    db.close()

# -------------------------------
# TEACHER MANAGEMENT (ADD)
# -------------------------------
def add_teacher_account(username, password, name, email, phone, gender, department, specialization, employee_id, institute):
    db = get_db_connection()
    c = db.cursor()
    from werkzeug.security import generate_password_hash
    hashed = generate_password_hash(password)
    
    c.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'teacher')", (username, hashed))
    user_id = c.lastrowid
    
    c.execute("""
        INSERT INTO teacher (user_id, full_name, email, phone, gender, department, specialization, employee_id, institute_name, joining_date, age, address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 0, '')
    """, (user_id, name, email, phone, gender, department, specialization, employee_id, institute))
    
    db.commit()
    c.close()
    db.close()
