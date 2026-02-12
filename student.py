import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )


# ================= CREATE PROFILE =================

def create_student_profile(cursor, user_id, email):
    cursor.execute("""
        INSERT INTO student(user_id,email)
        VALUES(%s,%s)
    """, (user_id, email))


# ================= FETCH PROFILE =================

def get_student_profile(user_id):
    db = get_db()
    c = db.cursor(dictionary=True)

    c.execute("SELECT * FROM student WHERE user_id=%s", (user_id,))
    student = c.fetchone()

    c.close()
    db.close()
    return student


# ================= UPDATE PROFILE =================

def update_student_profile(user_id, data):
    db = get_db()
    c = db.cursor()

    c.execute("""
        UPDATE student SET
            full_name=%s,
            age=%s,
            gender=%s,
            email=%s,
            phone=%s,
            address=%s,
            course=%s,
            department=%s,
            institute_name=%s,
            year_of_study=%s
        WHERE user_id=%s
    """, (
        data.get("full_name"),
        data.get("age"),
        data.get("gender"),
        data.get("email"),
        data.get("phone"),
        data.get("address"),
        data.get("course"),
        data.get("department"),
        data.get("institute_name"),
        data.get("year_of_study"),
        user_id
    ))

    db.commit()
    c.close()
    db.close()
