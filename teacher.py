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
            t.designation,
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

    cursor.execute("""
        UPDATE teacher t
        JOIN users u ON t.user_id = u.id
        SET 
            t.full_name = %s,
            t.email = %s,
            t.phone = %s,
            t.department = %s,
            t.designation = %s,
            t.institute_name = %s
        WHERE u.username = %s
    """, (
        data["full_name"],
        data["email"],
        data["phone"],
        data["department"],
        data["designation"],
        data["institute_name"],
        username
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
            t.designation,
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
        FROM courses c
        WHERE c.department = (
            SELECT department FROM teacher WHERE teacher_id = %s
        )
        ORDER BY c.created_at DESC
    """, (teacher_id,))

    courses = cursor.fetchall()
    cursor.close()
    db.close()
    return courses

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
        JOIN courses c ON e.course_id = c.course_id
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
        SELECT 1 FROM courses c
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