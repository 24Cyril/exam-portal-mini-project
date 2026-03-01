import mysql.connector
from flask import session

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
            t.id,
            t.user_id,
            t.full_name,
            t.email,
            t.phone,
            t.department_id,
            d.name as department_name,
            t.employee_id,
            u.username
        FROM teacher t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN department d ON t.department_id = d.id
        WHERE u.username = %s
        """,
        (username,)
    )

    teacher = cursor.fetchone()
    cursor.close()
    db.close()
    if teacher:
        # Compatibility field for existing templates
        teacher['department'] = teacher['department_name']
    return teacher

# -------------------------------
# UPDATE TEACHER PROFILE
# -------------------------------
def update_teacher_profile(username, data):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT id FROM users WHERE username=%s", (username,))
    user_row = cursor.fetchone()
    if not user_row:
        cursor.close()
        db.close()
        return

    user_id = user_row[0]

    cursor.execute("UPDATE teacher SET full_name = %s, email = %s, phone = %s WHERE user_id = %s", 
                   (data["full_name"], data["email"], data.get("phone"), user_id))

    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# GET DATA FOR TEACHER'S DEPT
# -------------------------------
def get_teacher_department_id(user_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("SELECT department_id FROM teacher WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    db.close()
    return row[0] if row else None

def get_students_by_department(dept_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.*, b.name as branch_name 
        FROM student s
        LEFT JOIN branch b ON s.branch_id = b.id
        WHERE s.department_id = %s
    """, (dept_id,))
    students = cursor.fetchall()
    cursor.close()
    db.close()
    return students

def get_pending_enrollments_by_dept(dept_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            sc.id,
            s.full_name AS student_name,
            s.email,
            c.course_name,
            sc.status,
            sc.created_at
        FROM student_course sc
        JOIN student s ON sc.student_id = s.id
        JOIN course c ON sc.course_id = c.course_id
        WHERE s.department_id = %s AND sc.status = 'Pending'
        ORDER BY sc.created_at DESC
    """, (dept_id,))
    enrollments = cursor.fetchall()
    cursor.close()
    db.close()
    return enrollments

def get_courses_by_department(dept_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.*, b.name as branch_name 
        FROM course c
        JOIN branch b ON c.branch_id = b.id
        WHERE b.department_id = %s
    """, (dept_id,))
    courses = cursor.fetchall()
    cursor.close()
    db.close()
    return courses

# -------------------------------
# VERIFICATIONS
# -------------------------------
def verify_enrollment_teacher(enrollment_id):
    db = get_db_connection()
    cursor = db.cursor()
    # Move to next step in workflow
    cursor.execute("UPDATE student_course SET status = 'Verified_Pending_Payment' WHERE id = %s", (enrollment_id,))
    db.commit()
    cursor.close()
    db.close()

def verify_payment_teacher(payment_id):
    db = get_db_connection()
    cursor = db.cursor()
    # 1. Update payment status
    cursor.execute("UPDATE payments SET status = 'Verified' WHERE payment_id = %s", (payment_id,))
    
    # 2. Update enrollment status to final step
    cursor.execute("""
        UPDATE student_course sc
        JOIN payments p ON sc.student_id = p.student_id AND sc.course_id = p.course_id
        SET sc.status = 'Enrolled_Active'
        WHERE p.payment_id = %s
    """, (payment_id,))
    
    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# EXAMS & RESULTS
# -------------------------------
def get_all_payments_by_dept(dept_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT
            p.payment_id,
            s.full_name AS student_name,
            s.email,
            c.course_name,
            p.amount,
            p.payment_type,
            p.verification_status,
            p.transaction_id,
            p.created_at
        FROM payments p
        JOIN student s ON p.student_id = s.id
        JOIN course c ON p.course_id = c.course_id
        WHERE s.department_id = %s
        ORDER BY p.created_at DESC
    """, (dept_id,))
    payments = cursor.fetchall()
    cursor.close()
    db.close()
    return payments

def get_exams_by_department(dept_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.*, c.course_name 
        FROM exams e
        JOIN course c ON e.course_id = c.course_id
        JOIN branch b ON c.branch_id = b.id
        WHERE b.department_id = %s
    """, (dept_id,))
    exams = cursor.fetchall()
    cursor.close()
    db.close()
    return exams

def publish_exam_results(exam_id):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE exams SET status = 'Published' WHERE exam_id = %s", (exam_id,))
    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# PERFORMANCE
# -------------------------------
def get_department_performance(dept_id=None):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    if dept_id:
        cursor.execute("""
            SELECT s.full_name, AVG(sub.score) as avg_score, d.name as department_name
            FROM student s
            JOIN student_exam_submissions sub ON s.id = sub.student_id
            JOIN department d ON s.department_id = d.id
            WHERE s.department_id = %s
            GROUP BY s.id
        """, (dept_id,))
    else:
        # Admin view: Average per department
        cursor.execute("""
            SELECT d.name as department_name, AVG(sub.score) as avg_score, 'All Students' as full_name
            FROM student s
            JOIN student_exam_submissions sub ON s.id = sub.student_id
            JOIN department d ON s.department_id = d.id
            GROUP BY d.id
        """)
        
    perf = cursor.fetchall()
    cursor.close()
    db.close()
    return perf