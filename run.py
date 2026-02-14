from flask import Flask, request, redirect, render_template, session, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os

from admin import (
    get_admin_profile_by_username,
    update_admin_profile,
    get_all_students,
    get_all_courses,
    get_all_registrations,
    get_all_payments,
    get_all_exams,
    add_exam,
    delete_exam,
    update_student_password
)

from student import (
    get_student_profile,
    create_student_profile,
    update_student_profile
)

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.secret_key = "secret123"

UPLOAD_FOLDER = "app/static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ================= DATABASE =================
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )


# ================= HOME =================
@app.route("/")
def home():
    return render_template("index.html")


# ================= REGISTER =================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]
        role = request.form["role"].lower()
        email = request.form.get("email")

        hashed = generate_password_hash(password)

        db = get_db_connection()
        c = db.cursor()

        c.execute(
            "INSERT INTO users(username,password,role) VALUES(%s,%s,%s)",
            (username, hashed, role)
        )
        user_id = c.lastrowid

        if role == "admin":
            c.execute("""
                INSERT INTO admin(username,password_hash,role,full_name,email)
                VALUES(%s,%s,%s,%s,%s)
            """, (username, hashed, "admin", username, email))

        if role == "student":
            create_student_profile(c, user_id, email)

        db.commit()
        c.close()
        db.close()

        return redirect("/")

    return render_template("register.html")


# ================= LOGIN =================
@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    db = get_db_connection()
    c = db.cursor(dictionary=True)

    c.execute("SELECT * FROM users WHERE username=%s", (username,))
    user = c.fetchone()

    c.close()
    db.close()

    if not user or not check_password_hash(user["password"], password):
        return "Invalid credentials"

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    return redirect("/admin" if user["role"] == "admin" else "/student")


# ================= ADMIN DASHBOARD =================
@app.route("/admin")
def admin_dashboard():
    if session.get("role") != "admin":
        return redirect("/")

    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin.html", admin=admin)


# ================= ADMIN UPDATE PROFILE =================
@app.route("/admin/update", methods=["GET", "POST"])
def admin_update():
    if session.get("role") != "admin":
        return redirect("/")

    if request.method == "POST":

        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        hashed = None
        if new_password:
            if new_password != confirm_password:
                return "Passwords do not match"
            hashed = generate_password_hash(new_password)

        update_admin_profile(session["username"], request.form, hashed)

        return redirect("/admin")

    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin_update_profile.html", admin=admin)


# ================= ADMIN APIs =================
@app.route("/admin/students")
def admin_students():
    return jsonify({"students": get_all_students()})


@app.route("/admin/courses")
def admin_courses():
    return jsonify({"courses": get_all_courses()})


@app.route("/admin/registrations")
def admin_registrations():
    return jsonify({"registrations": get_all_registrations()})


@app.route("/admin/payments")
def admin_payments():
    return jsonify({"payments": get_all_payments()})


@app.route("/admin/exams")
def admin_exams():
    return jsonify({"exams": get_all_exams()})


# ================= ADD EXAM =================
@app.route("/admin/add-exam", methods=["GET", "POST"])
def add_exam_route():

    if session.get("role") != "admin":
        return redirect("/")

    if request.method == "POST":

        exam_name = request.form["exam_name"]
        course_id = request.form["course_id"]
        exam_date = request.form["exam_date"]

        q = request.files.get("question_file")
        a = request.files.get("answer_file")

        qname = secure_filename(q.filename) if q else None
        aname = secure_filename(a.filename) if a else None

        if q:
            q.save(os.path.join(app.config["UPLOAD_FOLDER"], qname))
        if a:
            a.save(os.path.join(app.config["UPLOAD_FOLDER"], aname))

        add_exam(exam_name, course_id, exam_date, qname, aname)

        return redirect("/admin")

    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT course_id,course_name FROM courses")
    courses = c.fetchall()
    c.close()
    db.close()

    return render_template("add_exam.html", courses=courses)


@app.route("/admin/delete-exam/<int:id>", methods=["POST"])
def delete_exam_route(id):
    delete_exam(id)
    return jsonify({"success": True})


# ================= ADD STUDENT =================
@app.route("/admin/add-student", methods=["GET", "POST"])
def add_student_admin():

    if session.get("role") != "admin":
        return redirect("/")

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        name = request.form["full_name"]
        email = request.form["email"]
        phone = request.form["phone"]
        gender = request.form["gender"]
        course = request.form["course"]
        department = request.form["department"]
        year = request.form["year"]

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        c = db.cursor()

        c.execute(
            "INSERT INTO users(username,password,role) VALUES(%s,%s,%s)",
            (username, hashed_password, "student")
        )

        user_id = c.lastrowid

        c.execute("""
            INSERT INTO student
            (user_id,full_name,email,phone,gender,course,department,year_of_study)
            VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
        """, (user_id, name, email, phone, gender, course, department, year))

        db.commit()
        c.close()
        db.close()

        return redirect("/admin")

    return render_template("add_student.html")


# ================= EDIT STUDENT =================
@app.route("/admin/edit-student/<int:id>", methods=["GET", "POST"])
def edit_student_admin(id):

    if session.get("role") != "admin":
        return redirect("/")

    db = get_db_connection()
    c = db.cursor(dictionary=True)

    if request.method == "POST":

        c.execute("""
            UPDATE student SET
            full_name=%s,
            email=%s,
            phone=%s,
            gender=%s,
            course=%s,
            department=%s,
            year_of_study=%s
            WHERE id=%s
        """, (
            request.form["full_name"],
            request.form["email"],
            request.form["phone"],
            request.form["gender"],
            request.form["course"],
            request.form["department"],
            request.form["year"],
            id
        ))

        db.commit()
        c.close()
        db.close()

        return redirect("/admin")

    c.execute("SELECT * FROM student WHERE id=%s", (id,))
    student = c.fetchone()

    c.close()
    db.close()

    return render_template("edit_student.html", student=student)


# ================= STUDENT DASHBOARD =================
@app.route("/student")
def student_dashboard():
    if session.get("role") != "student":
        return redirect("/")

    student = get_student_profile(session["user_id"])
    return render_template("student.html", student=student)


@app.route("/save-profile", methods=["POST"])
def save_student_profile():
    update_student_profile(session["user_id"], request.form)
    return "Saved"


# ================= LOGOUT =================
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
