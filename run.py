from flask import Flask, request, redirect, render_template, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

from admin import get_admin_profile_by_username, update_admin_profile
from student import (
    get_student_profile,
    create_student_profile,
    update_student_profile
)

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.secret_key = "secret123"


def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Jec@023",
        database="project"
    )


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        role = request.form["role"].lower()
        email = request.form.get("email")

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s,%s,%s)",
            (username, hashed_password, role)
        )
        user_id = cursor.lastrowid

        if role == "admin":
            cursor.execute("""
                INSERT INTO admin (username,password_hash,role,full_name,email)
                VALUES (%s,%s,%s,%s,%s)
            """, (username, hashed_password, "admin", username, email))

        if role == "student":
            create_student_profile(cursor, user_id, email)

        db.commit()
        cursor.close()
        db.close()
        return redirect("/")

    return render_template("register.html")


@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
    user = cursor.fetchone()

    cursor.close()
    db.close()

    if not user or not check_password_hash(user["password"], password):
        return "Invalid credentials"

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    if user["role"] == "admin":
        return redirect("/admin")

    return redirect("/student")


@app.route("/admin")
def admin_dashboard():
    if "user_id" not in session or session["role"] != "admin":
        return redirect("/")

    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin.html", admin=admin)


@app.route("/student")
def student_dashboard():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")

    student = get_student_profile(session["user_id"])
    return render_template("student.html", student=student)


@app.route("/save-profile", methods=["POST"])
def save_student_profile():
    if "user_id" not in session or session["role"] != "student":
        return "Unauthorized"

    data = {
        "full_name": request.form.get("full_name"),
        "age": request.form.get("age"),
        "gender": request.form.get("gender"),
        "email": request.form.get("email"),
        "phone": request.form.get("phone"),
        "address": request.form.get("address"),
        "course": request.form.get("course"),
        "department": request.form.get("department"),
        "institute_name": request.form.get("institute_name"),
        "year_of_study": request.form.get("year_of_study")
    }

    update_student_profile(session["user_id"], data)
    return "Profile saved successfully"


@app.route("/editpro")
def edit_student_profile_page():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")
    return render_template("editpro.html")


# ================= ADMIN DATA APIs =================

@app.route("/admin/students")
def fetch_students():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM student")
    students = cursor.fetchall()
    cursor.close()
    db.close()

    return {"students": students}


@app.route("/admin/courses")
def fetch_courses():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM courses")
    courses = cursor.fetchall()
    cursor.close()
    db.close()

    return {"courses": courses}


@app.route("/admin/registrations")
def fetch_registrations():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT s.full_name, c.course_name,
               sc.enrollment_status, sc.payment_status, sc.registered_at
        FROM student_courses sc
        JOIN student s ON sc.student_id = s.id
        JOIN courses c ON sc.course_id = c.course_id
    """)

    data = cursor.fetchall()
    cursor.close()
    db.close()

    return {"registrations": data}


@app.route("/admin/payments")
def fetch_payments():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT s.full_name, c.course_name,
               p.amount, p.payment_method, p.payment_status, p.payment_date
        FROM payments p
        JOIN student s ON p.student_id = s.id
        JOIN courses c ON p.course_id = c.course_id
    """)

    data = cursor.fetchall()
    cursor.close()
    db.close()

    return {"payments": data}


# =========================
# ADD COURSE
# =========================

@app.route("/admin/add-course", methods=["GET", "POST"])
def add_course():
    if "user_id" not in session or session["role"] != "admin":
        return redirect("/")

    if request.method == "POST":
        name = request.form["course_name"]
        code = request.form["course_code"]
        duration = request.form["duration"]
        fee = request.form["fee"]

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO courses (course_name, course_code, duration, fee, status)
            VALUES (%s,%s,%s,%s,'Active')
        """, (name, code, duration, fee))

        db.commit()
        cursor.close()
        db.close()

        return redirect("/admin")

    return render_template("add_course.html")


# =========================
# EDIT COURSE
# =========================

@app.route("/admin/edit-course/<int:course_id>", methods=["GET", "POST"])
def edit_course(course_id):
    if "user_id" not in session or session["role"] != "admin":
        return redirect("/")

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    if request.method == "POST":
        name = request.form["course_name"]
        code = request.form["course_code"]
        duration = request.form["duration"]
        fee = request.form["fee"]

        cursor.execute("""
            UPDATE courses 
            SET course_name=%s, course_code=%s, duration=%s, fee=%s
            WHERE course_id=%s
        """, (name, code, duration, fee, course_id))

        db.commit()
        cursor.close()
        db.close()

        return redirect("/admin")

    cursor.execute("SELECT * FROM courses WHERE course_id=%s", (course_id,))
    course = cursor.fetchone()

    cursor.close()
    db.close()

    return render_template("edit_course.html", course=course)


# =========================
# DELETE COURSE
# =========================

@app.route("/admin/delete-course/<int:course_id>", methods=["POST"])
def delete_course(course_id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("DELETE FROM courses WHERE course_id=%s", (course_id,))

    db.commit()
    cursor.close()
    db.close()

    return {"success": True}






@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
