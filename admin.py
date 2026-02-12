import mysql.connector


def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )


# ================= ADMIN PROFILE =================

def get_admin_profile_by_username(username):
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM admin WHERE username=%s", (username,))
    data = c.fetchone()
    c.close()
    db.close()
    return data


def update_admin_profile(username, data):
    db = get_db()
    c = db.cursor()

    c.execute("""
        UPDATE admin SET
            full_name=%s,
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
    c.close()
    db.close()


# ================= TABLE FETCH =================

def get_all_students():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM student")
    data = c.fetchall()
    c.close()
    db.close()
    return data


def get_all_courses():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM courses")
    data = c.fetchall()
    c.close()
    db.close()
    return data


def get_all_registrations():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("""
        SELECT s.full_name, c.course_name,
        sc.enrollment_status, sc.payment_status, sc.registered_at
        FROM student_courses sc
        JOIN student s ON sc.student_id=s.id
        JOIN courses c ON sc.course_id=c.course_id
    """)
    data = c.fetchall()
    c.close()
    db.close()
    return data


def get_all_payments():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("""
        SELECT s.full_name, c.course_name,
        p.amount,p.payment_method,p.payment_status,p.payment_date
        FROM payments p
        JOIN student s ON p.student_id=s.id
        JOIN courses c ON p.course_id=c.course_id
    """)
    data = c.fetchall()
    c.close()
    db.close()
    return data


def get_all_exams():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("""
        SELECT e.exam_id,e.exam_name,c.course_name,
        e.exam_date,e.status,e.question_file,e.answer_file
        FROM exams e
        JOIN courses c ON e.course_id=c.course_id
    """)
    data = c.fetchall()
    c.close()
    db.close()
    return data


def add_exam(name, course_id, date, qfile, afile):
    db = get_db()
    c = db.cursor()
    c.execute("""
        INSERT INTO exams(exam_name,course_id,exam_date,question_file,answer_file)
        VALUES(%s,%s,%s,%s,%s)
    """, (name, course_id, date, qfile, afile))
    db.commit()
    c.close()
    db.close()


def delete_exam(id):
    db = get_db()
    c = db.cursor()
    c.execute("DELETE FROM exams WHERE exam_id=%s", (id,))
    db.commit()
    c.close()
    db.close()
