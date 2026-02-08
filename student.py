
import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="edun",
        database="project",
        use_pure=True,
        connection_timeout=5
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





# -------------------------------
# SAVE STUDENT PROFILE (AJAX)
# -------------------------------
def save_student_profile():
    if "user_id" not in session or session["role"] != "student":
        return "Unauthorized"

    data = {
        "full_name": request.form.get("full_name"),
        "age": request.form.get("age"),
        "gender": request.form.get("gender"),
        "email": request.form.get("email"),  # still editable later
        "phone": request.form.get("phone"),
        "address": request.form.get("address"),
        "course": request.form.get("course"),
        "department": request.form.get("department"),
        "institute_name": request.form.get("institute_name"),
        "year_of_study": request.form.get("year_of_study")
    }

    update_student_profile(session["user_id"], data)
    return "Profile saved successfully"
