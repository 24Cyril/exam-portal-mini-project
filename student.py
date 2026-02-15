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
    cur.execute("""
        UPDATE student SET
            full_name=%s, age=%s, gender=%s, email=%s,
            phone=%s, address=%s, course=%s,
            department=%s, institute_name=%s, year_of_study=%s
        WHERE user_id=%s
    """, (
        data["full_name"], data["age"], data["gender"], data["email"],
        data["phone"], data["address"], data["course"],
        data["department"], data["institute_name"],
        data["year_of_study"], user_id
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
        JOIN courses c
            ON c.department = s.department
        LEFT JOIN student_courses sc
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
        INSERT IGNORE INTO student_courses
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
        DELETE FROM student_courses
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
        SELECT c.course_id, c.course_name, p.amount,
        p.payment_method, p.transaction_id,
        sc.payment_verification_status,
        DATE(p.payment_date) AS payment_date
        FROM student_courses sc
        JOIN courses c ON sc.course_id=c.course_id
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
        SELECT %s, course_id, fee, %s, %s FROM courses WHERE course_id=%s
        ON DUPLICATE KEY UPDATE
            payment_method=VALUES(payment_method),
            transaction_id=VALUES(transaction_id),
            payment_date=NOW()
    """, (student_id, method, txn, course_id))

    cur.execute("""
        UPDATE student_courses
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

        FROM courses c
        LEFT JOIN student_courses sc
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
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT course_name, exam_date, marks, grade, attended, status
        FROM exam_results
        WHERE student_id = %s
    """, (user_id,))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


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
        FROM courses
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
       INSERT IGNORE INTO student_courses
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
        DELETE FROM student_courses
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
        FROM courses c
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
        UPDATE student_courses
        SET payment_verification_status = 'Submitted'
        WHERE student_id = %s AND course_id = %s
    """, (student_id, course_id))

    db.commit()
    cur.close()
    db.close()
