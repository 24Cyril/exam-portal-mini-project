
from flask import Flask, request, redirect, render_template, session, make_response
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
    get_all_payments,
    get_payment_by_id,
    verify_payment,
    reject_payment,
    get_all_registrations,
    get_all_exams,
    add_exam,
    delete_exam,
    update_student_password,
    get_course_by_id,
    add_course,
    update_course,
    delete_course
)
from admin import (
    insert_exam_questions,
    update_exam_time_limit,
    get_exam_questions,
    create_attempt,
    save_answer,
    submit_attempt,
    grade_attempt
)
from teacher import(
    get_teacher_profile_by_username,
    update_teacher_profile,
    get_all_teachers,
    get_courses_for_teacher,
    get_exams_for_teacher,
    create_exam_for_teacher,
    get_teacher_id
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
        email = request.form.get("email")

        # student-only fields
        department = request.form.get("department")
        course = request.form.get("course")
        year_of_study = request.form.get("year_of_study")

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        # users table
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, hashed_password, role)
        )
        user_id = cursor.lastrowid

        # ---------------- ADMIN PROFILE ----------------
        if role == "admin":
            cursor.execute(
                """
                INSERT INTO admin (username, password_hash, role, full_name, email)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (username, hashed_password, "admin", username, email)
            )

        # ---------------- STUDENT PROFILE ----------------
        if role == "student":
            cursor.execute(
                """
                INSERT INTO student 
                (user_id, email, department, course, year_of_study)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, email, department, course, year_of_study)
            )

        # ---------------- TEACHER PROFILE ----------------
        if role == "teacher":
            cursor.execute(
                """
                INSERT INTO teacher 
                (user_id, email, department, designation, institute_name)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, email, department, "Instructor", email)
            )

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

    # return full payment history (not only pending) for admin view
    payments = get_all_payments()
    return {"payments": payments}


# -------------------------------
# PAYMENT RECEIPT (admin or owning student)
# -------------------------------
@app.route("/payment/receipt/<int:payment_id>")
def payment_receipt(payment_id):
    if "user_id" not in session:
        return redirect("/")

    payment = get_payment_by_id(payment_id)
    if not payment:
        return {"error": "Not found"}, 404

    # allow admin or the owning student
    if session.get("role") == "student":
        student_id = get_student_id(session["user_id"])
        if payment["student_id"] != student_id:
            return {"error": "Unauthorized"}, 401

    html = render_template("receipt.html", payment=payment)
    if request.args.get("download") == "1":
        resp = make_response(html)
        resp.headers["Content-Disposition"] = f"attachment; filename=receipt-{payment_id}.html"
        resp.headers["Content-Type"] = "text/html"
        return resp

    return html


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


@app.route("/exam/<int:exam_id>")
def exam_page(exam_id):
    if "user_id" not in session or session.get("role") != "student":
        return redirect("/")
    # simple page that loads the exam UI which will call APIs
    return render_template("exam.html", exam_id=exam_id)


@app.route("/api/exam/<int:exam_id>/start", methods=["POST"])
def api_exam_start(exam_id):
    if "user_id" not in session or session.get("role") != "student":
        return {"error": "Unauthorized"}, 401

    student_id = get_student_id(session["user_id"])
    attempt_id = create_attempt(student_id, exam_id)

    # fetch questions
    qs = get_exam_questions(exam_id)

    # fetch time limit
    db = get_db_connection()
    c = db.cursor()
    c.execute("SELECT time_limit FROM exams WHERE exam_id=%s", (exam_id,))
    row = c.fetchone()
    tl = 30
    if row and row[0]:
        tl = int(row[0])
    c.close()
    db.close()

    return {"attempt_id": attempt_id, "questions": qs, "time_limit": tl}


@app.route("/api/exam/attempt/<int:attempt_id>/save", methods=["POST"])
def api_exam_save(attempt_id):
    if "user_id" not in session or session.get("role") != "student":
        return {"error": "Unauthorized"}, 401

    data = request.json
    q_no = data.get("q_no")
    selected = data.get("selected")
    if q_no is None:
        return {"error": "Missing q_no"}, 400

    save_answer(attempt_id, q_no, selected)
    return {"status": "saved"}


@app.route("/api/exam/attempt/<int:attempt_id>/submit", methods=["POST"])
def api_exam_submit(attempt_id):
    if "user_id" not in session or session.get("role") != "student":
        return {"error": "Unauthorized"}, 401

    data = request.json or {}
    duration = int(data.get("duration_seconds", 0))
    submit_attempt(attempt_id, duration)
    result = grade_attempt(attempt_id)
    return {"status": "submitted", "result": result}


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
        exam_date = request.form.get("exam_date")
        time_limit = int(request.form.get("time_limit", 30))

        q = request.files.get("question_file")
        a = request.files.get("answer_file")

        qname = secure_filename(q.filename) if q else None
        aname = secure_filename(a.filename) if a else None

        if q:
            q.save(os.path.join(app.config["UPLOAD_FOLDER"], qname))
        if a:
            a.save(os.path.join(app.config["UPLOAD_FOLDER"], aname))

        # insert exam and get id
        exam_id = add_exam(exam_name, course_id, exam_date, qname, aname)

        # update time limit
        update_exam_time_limit(exam_id, time_limit)

        # if both files present, parse and insert questions
        def parse_questions_from_file(qpath, apath):
            questions = []
            try:
                with open(qpath, "r", encoding="utf-8") as f:
                    raw = f.read().strip()

                # split by two newlines into blocks
                blocks = [b.strip() for b in raw.split("\n\n") if b.strip()]
                # read answers
                answers = []
                if apath:
                    with open(apath, "r", encoding="utf-8") as af:
                        for line in af:
                            t = line.strip()
                            if not t:
                                continue
                            # accept formats like 'A' or '1:A' or 'A)'
                            if ':' in t:
                                parts = t.split(':')
                                answers.append(parts[-1].strip())
                            else:
                                answers.append(t.strip())

                for idx, block in enumerate(blocks, start=1):
                    lines = [l.strip() for l in block.splitlines() if l.strip()]
                    if not lines:
                        continue
                    qtext = lines[0]
                    opts = {'option_a': None, 'option_b': None, 'option_c': None, 'option_d': None}
                    for line in lines[1:]:
                        ll = line
                        if ll[:2].lower().startswith('a'):
                            opts['option_a'] = ll.split(')',1)[-1].strip() if ')' in ll else ll[1:].strip()
                        elif ll[:2].lower().startswith('b'):
                            opts['option_b'] = ll.split(')',1)[-1].strip() if ')' in ll else ll[1:].strip()
                        elif ll[:2].lower().startswith('c'):
                            opts['option_c'] = ll.split(')',1)[-1].strip() if ')' in ll else ll[1:].strip()
                        elif ll[:2].lower().startswith('d'):
                            opts['option_d'] = ll.split(')',1)[-1].strip() if ')' in ll else ll[1:].strip()

                    correct = None
                    if len(answers) >= idx:
                        correct = answers[idx-1].strip().upper()[0]

                    questions.append({
                        'q_no': idx,
                        'question': qtext,
                        'option_a': opts['option_a'],
                        'option_b': opts['option_b'],
                        'option_c': opts['option_c'],
                        'option_d': opts['option_d'],
                        'correct_option': correct
                    })
            except Exception:
                pass
            return questions

        if qname and aname:
            qpath = os.path.join(app.config["UPLOAD_FOLDER"], qname)
            apath = os.path.join(app.config["UPLOAD_FOLDER"], aname)
            questions = parse_questions_from_file(qpath, apath)
            if questions:
                insert_exam_questions(exam_id, questions)

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
# ADMIN: DELETE STUDENT
# -------------------------------
@app.route("/admin/delete-student/<int:id>", methods=["POST"])
def delete_student_admin(id):
    if session.get("role") != "admin":
        return {"error": "Unauthorized"}, 401

    db = get_db_connection()
    c = db.cursor()

    # Get user_id first
    c.execute("SELECT user_id FROM student WHERE id=%s", (id,))
    result = c.fetchone()
    
    if result:
        user_id = result[0]
        # Delete from student table
        c.execute("DELETE FROM student WHERE id=%s", (id,))
        # Delete from users table
        c.execute("DELETE FROM users WHERE id=%s", (user_id,))
        db.commit()

    c.close()
    db.close()

    return {"success": True}


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
# ADMIN: ADD COURSE
# -------------------------------
@app.route("/admin/add-course", methods=["GET", "POST"])
def add_course_route():
    if session.get("role") != "admin":
        return redirect("/")

    if request.method == "POST":
        course_name = request.form["course_name"]
        course_code = request.form["course_code"]
        department = request.form.get("department", "")
        description = request.form.get("description", "")
        duration = request.form.get("duration", "")
        fee = request.form["fee"]
        status = request.form.get("status", "Active")
        
        # Get admin_id from session
        admin = get_admin_profile_by_username(session["username"])
        created_by = admin["admin_id"] if admin else None

        add_course(course_name, course_code, department, description, duration, fee, status, created_by)

        return redirect("/admin")

    return render_template("add_courses.html")


# -------------------------------
# ADMIN: EDIT COURSE
# -------------------------------
@app.route("/admin/edit-course/<int:id>", methods=["GET", "POST"])
def edit_course_route(id):
    if session.get("role") != "admin":
        return redirect("/")

    if request.method == "POST":
        course_name = request.form["course_name"]
        course_code = request.form["course_code"]
        department = request.form.get("department", "")
        description = request.form.get("description", "")
        duration = request.form.get("duration", "")
        fee = request.form["fee"]
        status = request.form.get("status", "Active")

        update_course(id, course_name, course_code, department, description, duration, fee, status)

        return redirect("/admin")

    course = get_course_by_id(id)
    return render_template("edit_courses.html", course=course)


# -------------------------------
# ADMIN: DELETE COURSE
# -------------------------------
@app.route("/admin/delete-course/<int:id>", methods=["POST"])
def delete_course_route(id):
    if session.get("role") != "admin":
        return {"error": "Unauthorized"}, 401
    
    delete_course(id)
    return {"success": True}



@app.route("/student/change-password", methods=["POST"])
def change_student_password():
    if session.get("role") != "student":
        return "Unauthorized", 403

    new_password = request.form["password"]
    user_id = session["user_id"]

    update_student_password(user_id, new_password)

    return redirect("/student/profile")


























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



