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
        "SELECT * FROM admin WHERE username = %s",
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

    if new_password:
        cursor.execute("""
            UPDATE admin
            SET full_name=%s,
                dob=%s,
                gender=%s,
                contact_number=%s,
                email=%s,
                institute_name=%s,
                institute_code=%s,
                institute_email=%s,
                password_hash=%s
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
            new_password,
            username
        ))
    else:
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
# FETCH ALL COURSES (ADMIN VIEW)
# -------------------------------
def get_all_courses():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            course_id,
            course_name,
            course_code,
            duration,
            fee,
            status,
            created_at
        FROM courses
        ORDER BY created_at DESC
    """)

    courses = cursor.fetchall()
    cursor.close()
    db.close()

    return courses


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
        FROM student_courses sc
        JOIN student s ON sc.student_id = s.id
        JOIN courses c ON sc.course_id = c.course_id
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
        UPDATE student_courses
        SET enrollment_verification_status = 'Verified',
            payment_verification_status = 'Pending'
        WHERE id = %s
    """, (enrollment_id,))

    # Get student_id and course_id to create payment record
    cursor.execute("""
        SELECT student_id, course_id
        FROM student_courses
        WHERE id = %s
    """, (enrollment_id,))
    
    result = cursor.fetchone()
    if result:
        student_id, course_id = result
        
        # Create payment record
        cursor.execute("""
            INSERT INTO payments (student_id, course_id, amount, verification_status)
            SELECT %s, course_id, fee, 'Pending'
            FROM courses
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
        UPDATE student_courses
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
        JOIN courses c ON p.course_id = c.course_id
        JOIN student_courses sc ON sc.student_id = p.student_id AND sc.course_id = p.course_id
        WHERE sc.payment_verification_status = 'Submitted'
        ORDER BY p.payment_date DESC
    """)

    payments = cursor.fetchall()
    cursor.close()
    db.close()

    return payments


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
        
        # Update payment verification status in student_courses
        cursor.execute("""
            UPDATE student_courses
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
            UPDATE student_courses
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
    cursor.execute("""SELECT s.full_name, c.course_name, sc.enrollment_status, sc.payment_verification_status AS payment_status, sc.created_at AS registered_at FROM student_courses sc JOIN student s ON sc.student_id=s.id JOIN courses c ON sc.course_id=c.course_id ORDER BY sc.created_at DESC""")  
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
    cursor.execute("""SELECT s.full_name, c.course_name, sc.enrollment_status, sc.payment_verification_status AS payment_status, sc.created_at AS registered_at FROM student_courses sc JOIN student s ON sc.student_id=s.id JOIN courses c ON sc.course_id=c.course_id ORDER BY sc.created_at DESC""")
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
    cursor.execute("""SELECT e.exam_id,e.exam_name,c.course_name, e.exam_date,e.status,e.question_file,e.answer_file FROM exams e JOIN courses c ON e.course_id=c.course_id ORDER BY e.exam_date DESC""")
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
    cursor.close()
    db.close()


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
