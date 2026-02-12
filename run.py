
from flask import Flask, request, redirect, render_template, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

from admin import get_admin_profile_by_username, update_admin_profile
from student import(
    get_student_profile,
    create_student_profile,
    update_student_profile,
    save_student_profile
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


def create_pending_payment(student_id, course_id):
    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO payments
        (student_id, course_id, amount, verification_status)
        SELECT %s, course_id, fee, 'Pending'
        FROM courses
        WHERE course_id = %s
        AND NOT EXISTS (
            SELECT 1 FROM payments
            WHERE student_id = %s AND course_id = %s
        )
    """, (student_id, course_id, student_id, course_id))

    db.commit()
    cur.close()
    db.close()


# ===============================
# COURSES (STUDENT SIDE)
# ===============================
@app.route("/api/student/courses")
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

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT course_name, exam_date, marks, grade, attended, status
        FROM exam_results
        WHERE student_id = %s
    """, (session["user_id"],))

    data = cursor.fetchall()
    cursor.close()
    db.close()
    return data


@app.route("/admin/students")
def admin_students():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            s.id,
            s.full_name,
            s.email,
            s.phone,
            s.gender,
            s.course,
            s.department,
            s.year_of_study,
            s.institute_name,
            s.created_at
        FROM student s
        ORDER BY s.created_at DESC
    """)

    students = cursor.fetchall()
    cursor.close()
    db.close()

    return {"students": students}





@app.route("/admin/courses")
def admin_courses():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            course_id,
            course_name,
            course_code,
            duration,
            fee,
            status,
            created_at
        FROM courses
        ORDER BY created_at DESC
    """)

    courses = cursor.fetchall()
    cursor.close()
    db.close()

    return {"courses": courses}

from flask import Blueprint, request, jsonify



# ---------------------------
# FETCH STUDENT PAYMENTS
# ---------------------------
@app.route("/api/student/payments")
def student_payments():
    student_id = session.get("user_id")
    if not student_id:
        return {"error": "Unauthorized"}, 401

    db = get_db_connection()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT 
            p.course_id,
            c.course_name,
            p.amount,
            p.payment_method,
            p.transaction_id,
            p.verification_status,
            DATE(p.payment_date) AS payment_date
        FROM payments p
        JOIN courses c ON p.course_id = c.course_id
        WHERE p.student_id = %s
    """, (student_id,))

    return cur.fetchall()

@app.route("/api/payment/manual", methods=["POST"])
def manual_payment():
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401

    data = request.json
    student_id = session["user_id"]

    db = get_db_connection()
    cur = db.cursor()

    cur.execute("""
        UPDATE payments
        SET 
            payment_method = %s,
            transaction_id = %s,
            verification_status = 'Submitted',
            payment_date = NOW()
        WHERE student_id = %s
        AND course_id = %s
        AND verification_status = 'Pending'
    """, (
        data["payment_method"],
        data.get("transaction_id"),
        student_id,
        data["course_id"]
    ))

    db.commit()
    return {"status": "Payment submitted"}




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



