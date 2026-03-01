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
import mysql.connector

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
# FETCH TEACHER PROFILE
# -------------------------------
def get_teacher_profile_by_username(username):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT 
            t.user_id,
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
        WHERE u.username = %s
        """,
        (username,)
    )

    teacher = cursor.fetchone()
    cursor.close()
    db.close()
    return teacher

# -------------------------------
# UPDATE TEACHER PROFILE
# -------------------------------
def update_teacher_profile(username, data):
    db = get_db_connection()
    cursor = db.cursor()

    # Get user_id from username
    cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
    user_row = cursor.fetchone()
    if not user_row:
        cursor.close()
        db.close()
        return

    user_id = user_row[0]

    # Check if teacher record exists
    cursor.execute("SELECT id FROM teacher WHERE user_id=%s", (user_id,))
    exists = cursor.fetchone()

    if exists:
        cursor.execute("""
            UPDATE teacher SET 
                full_name = %s,
                email = %s,
                phone = %s,
                department = %s,
                specialization = %s,
                institute_name = %s
            WHERE user_id = %s
        """, (
            data["full_name"],
            data["email"],
            data["phone"],
            data["department"],
            data["specialization"],
            data["institute_name"],
            user_id
        ))
    else:
        cursor.execute("""
            INSERT INTO teacher (user_id, full_name, email, phone, department, specialization, institute_name, joining_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            user_id,
            data["full_name"],
            data["email"],
            data["phone"],
            data["department"],
            data["specialization"],
            data["institute_name"]
        ))

    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# GET ALL TEACHERS (ADMIN VIEW)
# -------------------------------
def get_all_teachers():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            t.teacher_id,
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
# GET ALL TEACHERS (ADMIN VIEW)
# -------------------------------
def get_all_teachers():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            t.teacher_id,
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
# GET COURSES FOR TEACHER
# -------------------------------
def get_courses_for_teacher(teacher_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.course_id,
            c.course_name,
            c.course_code,
            c.department,
            c.description,
            c.fee,
            c.status,
            c.created_at
        FROM course c
        WHERE c.department = (
            SELECT department FROM teacher WHERE teacher_id = %s
        )
        ORDER BY c.created_at DESC
    """, (teacher_id,))

    course = cursor.fetchall()
    cursor.close()
    db.close()
    return course

# -------------------------------
# GET EXAMS FOR TEACHER
# -------------------------------
def get_exams_for_teacher(teacher_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            e.exam_id,
            e.exam_name,
            c.course_name,
            e.exam_date,
            e.time_limit,
            e.status,
            e.created_at
        FROM exams e
        JOIN course c ON e.course_id = c.course_id
        WHERE c.department = (
            SELECT department FROM teacher WHERE teacher_id = %s
        )
        ORDER BY e.exam_date DESC
    """, (teacher_id,))

    exams = cursor.fetchall()
    cursor.close()
    db.close()
    return exams

# -------------------------------
# CREATE EXAM FOR TEACHER
# -------------------------------
def create_exam_for_teacher(teacher_id, exam_name, course_id, exam_date, time_limit):
    db = get_db_connection()
    cursor = db.cursor()

    # Verify teacher has access to this course
    cursor.execute("""
        SELECT 1 FROM course c
        JOIN teacher t ON c.department = t.department
        WHERE c.course_id = %s AND t.teacher_id = %s
    """, (course_id, teacher_id))

    if not cursor.fetchone():
        cursor.close()
        db.close()
        return None

    cursor.execute("""
        INSERT INTO exams (exam_name, course_id, exam_date, time_limit, status)
        VALUES (%s, %s, %s, %s, 'Draft')
    """, (exam_name, course_id, exam_date, time_limit))

    exam_id = cursor.lastrowid
    db.commit()
    cursor.close()
    db.close()
    return exam_id

# -------------------------------
# GET TEACHER ID
# -------------------------------
def get_teacher_id(user_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT teacher_id FROM teacher WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    db.close()
    return row[0] if row else None