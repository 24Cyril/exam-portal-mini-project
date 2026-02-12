from flask import Flask, request, redirect, render_template, session, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os

from admin import get_admin_profile_by_username
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


def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )


@app.route("/")
def home():
    return render_template("index.html")


# ================= REGISTER =================
@app.route("/register", methods=["GET","POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        role = request.form["role"].lower()
        email = request.form.get("email")

        hashed = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "INSERT INTO users(username,password,role) VALUES(%s,%s,%s)",
            (username, hashed, role)
        )
        user_id = cursor.lastrowid

        if role == "admin":
            cursor.execute("""
                INSERT INTO admin(username,password_hash,role,full_name,email)
                VALUES(%s,%s,%s,%s,%s)
            """,(username, hashed, "admin", username, email))

        if role == "student":
            create_student_profile(cursor, user_id, email)

        db.commit()
        cursor.close()
        db.close()
        return redirect("/")

    return render_template("register.html")


# ================= LOGIN =================
@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE username=%s",(username,))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if not user or not check_password_hash(user["password"], password):
        return "Invalid credentials"

    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["role"] = user["role"]

    return redirect("/admin" if user["role"]=="admin" else "/student")


# ================= ADMIN =================
@app.route("/admin")
def admin_dashboard():
    if "user_id" not in session or session["role"]!="admin":
        return redirect("/")
    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin.html", admin=admin)


# ================= ADMIN APIs =================
@app.route("/admin/students")
def admin_students():
    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM student")
    data = c.fetchall()
    c.close(); db.close()
    return jsonify({"students":data})


@app.route("/admin/courses")
def admin_courses():
    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT * FROM courses")
    data = c.fetchall()
    c.close(); db.close()
    return jsonify({"courses":data})


# ================= EXAMS =================
@app.route("/admin/exams")
def admin_exams():
    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("""
        SELECT e.exam_id, e.exam_name, c.course_name,
               e.exam_date, e.status,
               e.question_file, e.answer_file
        FROM exams e
        JOIN courses c ON e.course_id = c.course_id
    """)
    data = c.fetchall()
    c.close(); db.close()
    return jsonify({"exams":data})


@app.route("/admin/add-exam", methods=["GET","POST"])
def add_exam():
    if request.method=="POST":
        exam_name = request.form["exam_name"]
        course_id = request.form["course_id"]
        exam_date = request.form["exam_date"]

        q = request.files.get("question_file")
        a = request.files.get("answer_file")

        qname = secure_filename(q.filename) if q else None
        aname = secure_filename(a.filename) if a else None

        if q: q.save(os.path.join(app.config["UPLOAD_FOLDER"], qname))
        if a: a.save(os.path.join(app.config["UPLOAD_FOLDER"], aname))

        db = get_db_connection()
        c = db.cursor()
        c.execute("""
            INSERT INTO exams(exam_name,course_id,exam_date,question_file,answer_file)
            VALUES(%s,%s,%s,%s,%s)
        """,(exam_name,course_id,exam_date,qname,aname))
        db.commit()
        c.close(); db.close()
        return redirect("/admin")

    db = get_db_connection()
    c = db.cursor(dictionary=True)
    c.execute("SELECT course_id,course_name FROM courses")
    courses = c.fetchall()
    c.close(); db.close()
    return render_template("add_exam.html", courses=courses)


@app.route("/admin/delete-exam/<int:id>", methods=["POST"])
def delete_exam(id):
    db = get_db_connection()
    c = db.cursor()
    c.execute("DELETE FROM exams WHERE exam_id=%s",(id,))
    db.commit()
    c.close(); db.close()
    return jsonify({"success":True})


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


if __name__=="__main__":
    app.run(debug=True)
