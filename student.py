import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )


def create_student_profile(cursor, user_id, email):
    cursor.execute(
        """
        INSERT INTO student (user_id, email)
        VALUES (%s, %s)
        """,
        (user_id, email)
    )


def get_student_profile(user_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM student WHERE user_id=%s",
        (user_id,)
    )
    student = cursor.fetchone()

    cursor.close()
    db.close()
    return student


def update_student_profile(user_id, data):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
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
        """,
        (
            data["full_name"],
            data["age"],
            data["gender"],
            data["email"],
            data["phone"],
            data["address"],
            data["course"],
            data["department"],
            data["institute_name"],
            data["year_of_study"],
            user_id
        )
    )

    db.commit()
    cursor.close()
    db.close()
# ===============================
# COURSES (STUDENT SIDE)
# ===============================

def get_all_courses():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            c.course_id,
            c.course_name,
            c.course_code,
            c.description,
            c.duration,
            c.fee,
            c.status,
            CASE 
                WHEN sc.id IS NULL THEN 'Not Registered'
                ELSE 'Registered'
            END AS registration_status
        FROM courses c
        LEFT JOIN student_courses sc
            ON c.course_id = sc.course_id
    """)

    courses = cursor.fetchall()

    cursor.close()
    db.close()

    return courses
