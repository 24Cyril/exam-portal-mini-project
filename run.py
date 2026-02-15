
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
    reject_payment
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



