
from flask import Flask, request, redirect, render_template, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

from admin import (
    get_admin_profile_by_username, 
    update_admin_profile,
    get_all_students,
    get_all_courses as get_all_courses_admin,
    get_pending_enrollments,
    verify_enrollment,
    reject_enrollment,
    get_pending_payments,
    verify_payment,
    reject_payment,
    get_all_registrations,
    get_all_exams,
    add_exam,
    delete_exam,
    update_student_password
)
from student import(
    get_student_profile,
    create_student_profile,
    save_student_profile,
    get_student_id,
    get_all_courses_for_student,
    fetch_student_exams,
    fetch_student_payments,
    create_pending_payment,
    enroll_in_course,
    unenroll_from_course,
    submit_manual_payment
)

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.secret_key = "secret123"


# -------------------------------
# DATABASE CONNECTION
# -------------------------------

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
         use_pure=True,
    )


# -------------------------------
# HOME
# -------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------------------
# REGISTER
# -------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        role = request.form["role"].lower()
        email = request.form.get("email")   # ✅ EMAIL FROM FORM

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        # users table
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, hashed_password, role)
        )
        user_id = cursor.lastrowid

        # ---------------- ADMIN PROFILE AUTO-CREATE ----------------
        if role == "admin":
            cursor.execute(
                """
                INSERT INTO admin (username, password_hash, role, full_name, email)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (username, hashed_password, "admin", username, email)
            )

        # ---------------- STUDENT PROFILE AUTO-CREATE ----------------
        if role == "student":
            create_student_profile(cursor, user_id, email)

        db.commit()
        cursor.close()
        db.close()

        return redirect("/")

    return render_template("register.html")


# -------------------------------
# LOGIN
# -------------------------------
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



# -------------------------------
# ADMIN DASHBOARD
# -------------------------------
@app.route("/admin")
def admin_dashboard():
    if "user_id" not in session or session["role"] != "admin":
        return redirect("/")

    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin.html", admin=admin)


# -------------------------------
# STUDENT DASHBOARD
# -------------------------------
@app.route("/student")
def student_dashboard():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")

    student = get_student_profile(session["user_id"])
    return render_template("student.html", student=student)


@app.route("/save-profile", methods=["POST"])
def save_profile():
    return save_student_profile()


@app.route("/api/student/profile")
def api_student_profile():
    if "user_id" not in session or session["role"] != "student":
        return {"error": "Unauthorized"}, 401

    student = get_student_profile(session["user_id"])
    return student


# ===============================
# COURSES (STUDENT SIDE)
# ===============================
@app.route("/api/student/courses")
def get_all_courses():
    if "user_id" not in session:
        return []

    student_id = get_student_id(session["user_id"])
    return get_all_courses_for_student(student_id)



# -------------------------------
# EDIT STUDENT PROFILE PAGE
# -------------------------------
@app.route("/editpro", methods=["GET","POST"])
def edit_student_profile_page():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")

    return render_template("editpro.html")


@app.route("/api/student/exams")
def student_exam_api():
    if "user_id" not in session:
        return []

    return fetch_student_exams(session["user_id"])


@app.route("/admin/students")
def admin_students():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    students = get_all_students()
    return {"students": students}





@app.route("/admin/courses")
def admin_courses():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    courses = get_all_courses_admin()
    return {"courses": courses}

from flask import Blueprint, request, jsonify



# ---------------------------
# FETCH STUDENT PAYMENTS
# ---------------------------
@app.route("/api/student/payments")
def student_payments():
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401

    student_id = get_student_id(session["user_id"])
    return fetch_student_payments(student_id)


#payment manual
@app.route("/api/payment/manual", methods=["POST"])
def manual_payment():
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401

    data = request.json
    student_id = get_student_id(session["user_id"])
    course_id = data["course_id"]

    submit_manual_payment(
        student_id, 
        course_id, 
        data["payment_method"], 
        data.get("transaction_id")
    )

    return {"status": "Payment submitted"}


#stufent enroll
@app.route("/api/student/enroll", methods=["POST"])
def enroll_course():
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401

    student_id = get_student_id(session["user_id"])
    course_id = request.json["course_id"]

    enroll_in_course(student_id, course_id)

    return {"status": "enrolled"}


#un enroll
@app.route("/api/student/unenroll", methods=["POST"])
def unenroll_course():
    student_id = get_student_id(session["user_id"])
    course_id = request.json["course_id"]

    unenroll_from_course(student_id, course_id)

    return {"status": "unenrolled"}




# -------------------------------
# ADMIN: PENDING ENROLLMENTS
# -------------------------------
@app.route("/admin/enrollments")
def admin_enrollments():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    enrollments = get_pending_enrollments()
    return {"enrollments": enrollments}


# -------------------------------
# ADMIN: VERIFY ENROLLMENT
# -------------------------------
@app.route("/admin/enrollments/verify/<int:enrollment_id>", methods=["POST"])
def admin_verify_enrollment(enrollment_id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    verify_enrollment(enrollment_id)
    return {"status": "Enrollment verified"}


# -------------------------------
# ADMIN: REJECT ENROLLMENT
# -------------------------------
@app.route("/admin/enrollments/reject/<int:enrollment_id>", methods=["POST"])
def admin_reject_enrollment(enrollment_id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    reject_enrollment(enrollment_id)
    return {"status": "Enrollment rejected"}


# -------------------------------
# ADMIN: PENDING PAYMENTS
# -------------------------------
@app.route("/admin/payments")
def admin_payments():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    payments = get_pending_payments()
    return {"payments": payments}


# -------------------------------
# ADMIN: VERIFY PAYMENT
# -------------------------------
@app.route("/admin/payments/verify/<int:payment_id>", methods=["POST"])
def admin_verify_payment(payment_id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    verify_payment(payment_id)
    return {"status": "Payment verified"}


# -------------------------------
# ADMIN: REJECT PAYMENT
# -------------------------------
@app.route("/admin/payments/reject/<int:payment_id>", methods=["POST"])
def admin_reject_payment(payment_id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    reject_payment(payment_id)
    return {"status": "Payment rejected"}


# -------------------------------
# ADMIN: REGISTRATIONS API
# -------------------------------
@app.route("/admin/registrations")
def admin_registrations():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    
    return {"registrations": get_all_registrations()}


# -------------------------------
# ADMIN: EXAMS API
# -------------------------------
@app.route("/admin/exams")
def admin_exams():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    
    return {"exams": get_all_exams()}


# -------------------------------
# ADMIN: ADD EXAM
# -------------------------------
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = "app/static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

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


# -------------------------------
# ADMIN: DELETE EXAM
# -------------------------------
@app.route("/admin/delete-exam/<int:id>", methods=["POST"])
def delete_exam_route(id):
    if session.get("role") != "admin":
        return {"error": "Unauthorized"}, 401
    
    delete_exam(id)
    return {"success": True}


# -------------------------------
# ADMIN: ADD STUDENT
# -------------------------------
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


# -------------------------------
# ADMIN: EDIT STUDENT
# -------------------------------
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


# -------------------------------
# ADMIN: UPDATE PROFILE
# -------------------------------
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


# -------------------------------
# LOGOUT
# -------------------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


# -------------------------------
# RUN
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)



