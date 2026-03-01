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
#   email, username, last_login, created_at, updated_at

# STUDENT
# - Stores student profile information
# - Each student is linked to a user account
# - Fields: id, user_id, full_name, age, gender, email, phone,
#   address, course, department, institute_name, year_of_study,
#   enrollment_date, created_at, updated_at

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
#   exam_date, created_by, created_at

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
# 
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
# STUDENT ID
# -------------------------------
def get_student_id(user_id):
    db = get_db_connection()
    cur = db.cursor()
    cur.execute("SELECT id FROM student WHERE user_id=%s", (user_id,))
    row = cur.fetchone()
    cur.close()
    db.close()
    return row[0] if row else None



#profile data
def get_student_profile(user_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    cur.execute("SELECT * FROM student WHERE user_id=%s", (user_id,))
    data = cur.fetchone()
    cur.close()
    db.close()
    return data


#update student profile
def update_student_profile(user_id, data):
    db = get_db_connection()
    cur = db.cursor()
    # Check if student record exists
    cur.execute("SELECT id FROM student WHERE user_id=%s", (user_id,))
    exists = cur.fetchone()
    
    if exists:
        cur.execute("""
            UPDATE student SET
                full_name=%s, age=%s, gender=%s, email=%s,
                phone=%s, address=%s, course=%s,
                department=%s, institute_name=%s, year_of_study=%s,
                dob=%s, blood_group=%s, nationality=%s,
                emergency_contact=%s, city=%s, state=%s,
                pincode=%s, country=%s, semester=%s, roll_number=%s
            WHERE user_id=%s
        """, (
            data["full_name"], data["age"], data["gender"], data["email"],
            data["phone"], data["address"], data["course"],
            data["department"], data["institute_name"], data["year_of_study"],
            data.get("dob"), data.get("blood_group"), data.get("nationality"),
            data.get("emergency_contact"), data.get("city"), data.get("state"),
            data.get("pincode"), data.get("country"), data.get("semester"), data.get("roll_number"),
            user_id
        ))
    else:
        cur.execute("""
            INSERT INTO student (user_id, full_name, age, gender, email, phone, address, course, department, institute_name, year_of_study, 
                                dob, blood_group, nationality, emergency_contact, city, state, pincode, country, semester, roll_number, enrollment_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            user_id, data["full_name"], data["age"], data["gender"], data["email"],
            data["phone"], data["address"], data["course"],
            data["department"], data["institute_name"], data["year_of_study"],
            data.get("dob"), data.get("blood_group"), data.get("nationality"),
            data.get("emergency_contact"), data.get("city"), data.get("state"),
            data.get("pincode"), data.get("country"), data.get("semester"), data.get("roll_number")
        ))
    db.commit()
    cur.close()
    db.close()

#save student profile
def save_student_profile():
    if session.get("role") != "student":
        return "Unauthorized"

    update_student_profile(session["user_id"], request.form)
    return "Profile saved"


# -------------------------------
# COURSES
# -------------------------------
def fetch_student_courses(student_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT 
            c.course_id,
            c.course_name,
            c.description,
            c.fee,
            c.status,

            IF(sc.id IS NULL, 'Not Enrolled', sc.enrollment_status) 
                AS enrollment_status,

            sc.enrollment_verification_status,
            sc.payment_verification_status

        FROM student s
        JOIN course c
            ON c.department = s.department
        LEFT JOIN student_course sc
            ON c.course_id = sc.course_id
           AND sc.student_id = s.id

        WHERE s.id = %s
    """, (student_id,))

    data = cur.fetchall()
    cur.close()
    db.close()
    return data

# -------------------------------
# ENROLL / UNENROLL
# -------------------------------
def enroll_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()
    cur.execute("""
        INSERT IGNORE INTO student_course
        (student_id, course_id)
        VALUES (%s,%s)
    """, (student_id, course_id))
    db.commit()
    cur.close()
    db.close()

def unenroll_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()
    cur.execute("""
        DELETE FROM student_course
        WHERE student_id=%s AND course_id=%s
    """, (student_id, course_id))
    db.commit()
    cur.close()
    db.close()


# -------------------------------
# PAYMENTS
# -------------------------------
def fetch_student_payments(student_id):
    db = get_db_connection()
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT p.payment_id, c.course_id, c.course_name, p.amount,
        p.payment_method, p.transaction_id,
        sc.payment_verification_status,
        DATE(p.payment_date) AS payment_date
        FROM student_course sc
        JOIN course c ON sc.course_id=c.course_id
        LEFT JOIN payments p
        ON p.student_id=sc.student_id AND p.course_id=sc.course_id
        WHERE sc.student_id=%s
        AND sc.enrollment_verification_status = 'Verified'
        AND sc.payment_verification_status != 'Not Required'
    """, (student_id,))
    data = cur.fetchall()
    cur.close()
    db.close()
    return data


#submit payment
def submit_payment(student_id, course_id, method, txn):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO payments (student_id, course_id, amount, payment_method, transaction_id)
        SELECT %s, course_id, fee, %s, %s FROM course WHERE course_id=%s
        ON DUPLICATE KEY UPDATE
            payment_method=VALUES(payment_method),
            transaction_id=VALUES(transaction_id),
            payment_date=NOW()
    """, (student_id, method, txn, course_id))

    cur.execute("""
        UPDATE student_course
        SET payment_verification_status='Submitted'
        WHERE student_id=%s AND course_id=%s
    """, (student_id, course_id))

    db.commit()
    cur.close()
    db.close()


# -------------------------------
# FETCH ALL COURSES (STUDENT VIEW)
# -------------------------------
def get_all_courses_for_student(student_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.course_id,
            c.course_name,
            c.description,
            c.duration,
            c.fee,
            c.status,

            IF(sc.id IS NULL, 'Not Enrolled', sc.enrollment_status) 
                AS enrollment_status,

            sc.enrollment_verification_status,
            sc.payment_verification_status

        FROM course c
        LEFT JOIN student_course sc
            ON c.course_id = sc.course_id
           AND sc.student_id = %s
    """, (student_id,))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


# -------------------------------
# FETCH STUDENT EXAMS
# -------------------------------
def fetch_student_exams(user_id):
    """Return scheduled exams for the student along with attempt/result info.

    Accepts `user_id` (users.id) as provided by session and returns a list
    of objects containing: exam_id, course_name, exam_date, time_limit,
    marks, grade, attended, status.
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # find student.id from users.id
    cursor.execute("SELECT id FROM student WHERE user_id=%s", (user_id,))
    row = cursor.fetchone()
    # cursor is dictionary cursor, so fetchone returns a dict
    student_id = row.get('id') if row else None

    # If student record not found, return empty list
    if not student_id:
        cursor.close()
        db.close()
        return []

    # select exams for course (all exams). left join any attempt by this student
    cursor.execute("""
        SELECT
            e.exam_id,
            c.course_name,
            e.exam_date,
            e.time_limit,
            sa.attempt_id,
            sa.submitted_at IS NOT NULL AS attended,
            sa.score AS marks,
            sa.graded AS graded,
            (SELECT COUNT(*) FROM exam_questions q WHERE q.exam_id = e.exam_id) AS total_questions
        FROM exams e
        JOIN course c ON e.course_id = c.course_id
        LEFT JOIN student_attempts sa ON sa.exam_id = e.exam_id AND sa.student_id = %s
        ORDER BY e.exam_date DESC
    """, (student_id,))

    rows = cursor.fetchall()

    # normalize fields expected by front-end
    out = []
    for r in rows:
        marks = r.get('marks')
        total_q = r.get('total_questions') or 0
        grade = None
        if marks is not None and total_q > 0:
            try:
                pct = (float(marks) / float(total_q)) * 100.0
            except Exception:
                pct = 0.0

            if pct >= 90:
                grade = 'A'
            elif pct >= 75:
                grade = 'B'
            elif pct >= 60:
                grade = 'C'
            elif pct >= 50:
                grade = 'D'
            else:
                grade = 'F'

        out.append({
            'exam_id': r.get('exam_id'),
            'course_name': r.get('course_name'),
            'exam_date': r.get('exam_date').isoformat() if r.get('exam_date') else None,
            'time_limit': r.get('time_limit'),
            'marks': marks,
            'grade': grade,
            'attended': 'Attended' if r.get('attended') else 'Not Attended',
            'status': 'Published'
        })

    cursor.close()
    db.close()
    return out


# -------------------------------
# CREATE PENDING PAYMENT
# -------------------------------
def create_pending_payment(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO payments
        (student_id, course_id, amount, verification_status)
        SELECT %s, course_id, fee, 'Pending'
        FROM course
        WHERE course_id = %s
        AND NOT EXISTS (
            SELECT 1 FROM payments
            WHERE student_id = %s AND course_id = %s
        )
    """, (student_id, course_id, student_id, course_id))

    db.commit()
    cur.close()
    db.close()


# -------------------------------
# ENROLL IN COURSE (WITHOUT AUTO PAYMENT)
# -------------------------------
def enroll_in_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()

    # Enroll student - payment will be created only after admin verification
    cur.execute("""
       INSERT IGNORE INTO student_course
        (student_id, course_id, enrollment_status, enrollment_verification_status, payment_verification_status)
            VALUES (%s, %s, 'Enrolled', 'Pending', 'Not Required')

    """, (student_id, course_id))
   
    db.commit()
    cur.close()
    db.close()


# -------------------------------
# UNENROLL FROM COURSE
# -------------------------------
def unenroll_from_course(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        DELETE FROM student_course
        WHERE student_id=%s AND course_id=%s
    """, (student_id, course_id))

    db.commit()
    cur.close()
    db.close()


# -------------------------------
# SUBMIT MANUAL PAYMENT
# -------------------------------
def submit_manual_payment(student_id, course_id, payment_method, transaction_id):
    db = get_db_connection()
    cur = db.cursor()

    # 1️⃣ Insert or update payment details
    cur.execute("""
        INSERT INTO payments 
            (student_id, course_id, amount, payment_method, transaction_id, payment_date)
        SELECT 
            %s, c.course_id, c.fee, %s, %s, NOW()
        FROM course c
        WHERE c.course_id = %s
        ON DUPLICATE KEY UPDATE
            payment_method = VALUES(payment_method),
            transaction_id = VALUES(transaction_id),
            payment_date = NOW()
    """, (
        student_id,
        payment_method,
        transaction_id,
        course_id
    ))

    # 2️⃣ Update COURSE STATE
    cur.execute("""
        UPDATE student_course
        SET payment_verification_status = 'Submitted'
        WHERE student_id = %s AND course_id = %s
    """, (student_id, course_id))

    db.commit()
    cur.close()
    db.close()
