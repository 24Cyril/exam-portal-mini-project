# ============================================================
# EXAM PORTAL DATABASE SCHEMA (MySQL)
# ------------------------------------------------------------
# This comment block documents the database structure used in
# the Exam Portal Mini Project. It is for reference only.
# Data types and variable sizes are intentionally omitted.
# ============================================================

# USERS
# - Stores authentication credentials for all users
# - Fields: id, username, password, role

# ADMIN
# - Stores admin profile details
# - Linked logically with users table
# - Fields: admin_id, full_name, dob, gender, contact_number,
#   email, username, institute_name, institute_code, institute_email,
#   last_login, created_at, updated_at

# STUDENT
# - Stores student profile information
# - Each student is linked to a user account
# - Fields: id, user_id, full_name, age, gender, email, phone,
#   address, course, department, institute_name, year_of_study,
#   enrollment_date, dob, blood_group, nationality, emergency_contact,
#   city, state, pincode, country, semester, roll_number,
#   created_at, updated_at

# TEACHER
# - Stores teacher profile information
# - Each teacher is linked to a user account
# - Fields: id, user_id, full_name, age, gender, email, phone,
#   address, department, specialization, institute_name,
#   employee_id, joining_date, created_at, updated_at

# COURSES
# - Stores course details created by admin
# - Fields: course_id, course_name, course_code, department,
#   description, duration, fee, status, created_by,
#   created_at, updated_at

# STUDENT_COURSES
# - Manages student enrollment into course
# - Tracks enrollment and payment verification status
# - Fields: id, student_id, course_id, enrollment_status,
#   enrollment_verification_status, payment_verification_status,
#   created_at, enrollment_verified_at, payment_verified_at

# PAYMENTS
# - Stores payment details for course enrollment
# - Fields: payment_id, student_id, course_id, amount,
#   payment_method, transaction_id, verification_status,
#   created_at

# EXAMS
# - Stores exams conducted for course
# - Fields: exam_id, course_id, exam_name, exam_type,
#   total_questions, duration_minutes, passing_score,
#   exam_date, question_file, answer_file, status,
#   created_by, created_at

# EXAM_QUESTIONS
# - Stores questions belonging to exams
# - Fields: question_id, exam_id, question_text,
#   option1, option2, option3, option4,
#   correct_answer, marks, question_order

# STUDENT_EXAM_RESULTS
# - Stores exam results of students
# - Fields: result_id, student_id, exam_id, score,
#   total_marks, percentage, status, attempted_at

# NOTES
# - Stores study notes for course
# - Fields: note_id, course_id, title, content,
#   created_by, created_at

# STUDENT_NOTES_ACCESS
# - Tracks which student accessed which note
# - Fields: id, student_id, note_id, access_date

# STUDENT_PERFORMANCE
# - Stores performance metrics of students
# - Fields: performance_id, student_id, course_id,
#   exam_id, performance_metric, value, recorded_at

# TEACHER_STUDENT_PROGRESS
# - Allows teachers to track student progress per course
# - Fields: progress_id, teacher_id, student_id,
#   course_id, progress_notes, last_updated

# ============================================================
# END OF DATABASE SCHEMA DOCUMENTATION
# ============================================================
from flask import Flask, request, redirect, render_template, session, make_response
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

from student import(
    get_student_id,
    get_student_profile_by_username,
    update_student_profile,
    get_all_courses_for_student,
    enroll_in_course,
    unenroll_from_course,
    submit_manual_payment,
    fetch_student_payments,
    fetch_student_exams,
    fetch_student_notes
)

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
    delete_course,
    get_all_teachers,
    add_teacher_account,
    delete_teacher,
    get_all_departments,
    add_department,
    delete_department
)
from exams import (
    check_exam_eligibility,
    create_exam_attempt,
    save_student_answer,
    finalize_exam_attempt,
    evaluate_exam
)
from teacher import(
    get_teacher_profile_by_username,
    update_teacher_profile,
    get_teacher_department_id,
    get_students_by_department,
    get_courses_by_department,
    verify_enrollment_teacher,
    verify_payment_teacher,
    get_exams_by_department,
    publish_exam_results,
    get_department_performance
)
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
from flask import request, redirect, render_template
from werkzeug.security import generate_password_hash
import traceback

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":
        try:
            print("REGISTER HIT")

            username = request.form.get("username", "")
            password = request.form.get("password", "")
            role = request.form.get("role", "student").lower()
            email = request.form.get("email", "")
            full_name = request.form.get("full_name", "")
            a_full_name = request.form.get("a_full_name", "")
            s_full_name = request.form.get("s_full_name", "")
            
            logger.debug(f"Handling registration for {username} - {role}")

            hashed_password = generate_password_hash(password)

            db = get_db_connection()
            cursor = db.cursor()

            cursor.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, hashed_password, role)
            )
            user_id = cursor.lastrowid
            logger.info(f"User record created in memory with ID: {user_id}")
            
            # Helper function for safe int conversion
            def safe_int(val, default=0):
                try:
                    return int(val) if val else default
                except (ValueError, TypeError):
                    return default

            # ---------------- ADMIN ----------------
            if role == "admin":
                cursor.execute("""
                    INSERT INTO admin (user_id, full_name, email, dob, gender, contact_number)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    user_id, 
                    a_full_name, 
                    email, 
                    request.form.get("dob") or None, 
                    request.form.get("a_gender", ""), 
                    request.form.get("contact_number", "")
                ))
                print("admin created")

            # ---------------- STUDENT ----------------
            elif role == "student":
                cursor.execute("""
                    INSERT INTO student
                    (user_id, full_name, age, gender, email, phone, address, department, branch, institute_name, year_of_study, enrollment_date, roll_number)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    user_id,
                    s_full_name,
                    safe_int(request.form.get("age")),
                    request.form.get("gender", ""),
                    email,
                    request.form.get("phone", ""),
                    request.form.get("address", ""),
                    request.form.get("department", ""),
                    request.form.get("course", ""), # In HTML the Branch input has name="course"
                    request.form.get("institute_name", ""),
                    safe_int(request.form.get("year_of_study")),
                    request.form.get("enrollment_date") or "2024-01-01",
                    request.form.get("roll_number", "")
                ))
                logger.info(f"Student record created for {user_id}")

            # ---------------- TEACHER ----------------
            elif role == "teacher":
                cursor.execute("""
                    INSERT INTO teacher
                    (user_id, full_name, age, gender, email, phone, address, department, specialization, institute_name, employee_id, joining_date)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    user_id,
                    full_name,
                    safe_int(request.form.get("tutor_age")),
                    request.form.get("tutor_gender", ""),
                    email,
                    request.form.get("tutor_phone", ""),
                    request.form.get("tutor_address", ""),
                    request.form.get("department", ""),
                    request.form.get("specialization", ""),
                    request.form.get("institute_name", ""),
                    request.form.get("employee_id", ""),
                    request.form.get("joining_date") or "2024-01-01"
                ))
                print("teacher created")

            db.commit()
            cursor.close()
            db.close()

            print("REGISTER SUCCESS")
            return redirect("/")

        except Exception as e:
            if 'db' in locals():
                db.rollback()
            logger.error(f"REGISTER ERROR: {traceback.format_exc()}")
            return f"REGISTER ERROR: {str(e)}"

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

    if user["role"] == "admin" or user["role"] == "teacher":
        return redirect("/teacher")
    
    else:
         return redirect("/student")


@app.route("/student")
def student_dashboard():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")
    
    from student import get_student_profile_by_username
    student_profile = get_student_profile_by_username(session["username"])
        
    return render_template("student.html", student=student_profile)


@app.route("/teacher")
def teacher_dashboard():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return redirect("/")

    if session["role"] == "admin":
        from admin import get_admin_profile_by_username
        profile = get_admin_profile_by_username(session["username"])
        profile_type = 'admin'
    else:
        profile = get_teacher_profile_by_username(session["username"])
        profile_type = 'teacher'

    return render_template("teacher.html", teacher=profile, profile_type=profile_type)


# -------------------------------
# ADMIN ONLY: TEACHER & DEPT
# -------------------------------
@app.route("/teacher/departments")
def get_departments_route():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import get_all_departments
    return {"departments": get_all_departments()}

@app.route("/teacher/add-department", methods=["POST"])
def add_department_route():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import add_department
    data = request.json
    add_department(data["name"], data["code"], session["user_id"])
    return {"success": True}

@app.route("/teacher/delete-department/<int:id>", methods=["POST"])
def delete_department_route(id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import delete_department
    delete_department(id)
    return {"success": True}

@app.route("/teacher/teachers")
def get_teachers_route():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import get_all_teachers
    return {"teachers": get_all_teachers()}

@app.route("/teacher/add-teacher", methods=["POST"])
def add_teacher_route():
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import add_teacher_account
    data = request.json
    add_teacher_account(
        data["username"], data["password"], data["name"],
        data["email"], data["phone"], data["gender"],
        data["department"], data["specialization"],
        data["employee_id"], data["institute"]
    )
    return {"success": True}

@app.route("/teacher/delete-teacher/<int:id>", methods=["POST"])
def delete_teacher_route(id):
    if "user_id" not in session or session["role"] != "admin":
        return {"error": "Unauthorized"}, 401
    from admin import delete_teacher
    delete_teacher(id)
    return {"success": True}




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
def student_get_all_courses():
    if "user_id" not in session:
        return []

    from student import get_student_id, get_all_courses_for_student
    student_id = get_student_id(session["user_id"])
    return get_all_courses_for_student(student_id)



# -------------------------------
# EDIT STUDENT PROFILE PAGE
# -------------------------------
@app.route("/editpro", methods=["GET","POST"])
def edit_student_profile_page():
    if "user_id" not in session or session["role"] != "student":
        return redirect("/")

    from student import get_student_profile
    student = get_student_profile(session["user_id"])
    return render_template("editpro.html", student=student)


@app.route("/api/student/exams")
def student_exam_api():
    if "user_id" not in session:
        return []
    
    student_id = get_student_id(session["user_id"])
    return {"exams": fetch_student_exams(student_id)}

@app.route("/api/student/notes")
def student_notes_api():
    if "user_id" not in session:
        return []
    
    student_id = get_student_id(session["user_id"])
    return {"notes": fetch_student_notes(student_id)}


@app.route("/teacher/students")
def teacher_students():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    if session["role"] == "admin":
        students = get_all_students()
    else:
        dept_id = get_teacher_department_id(session["user_id"])
        students = get_students_by_department(dept_id)
    return {"students": students}

@app.route("/teacher/courses")
def teacher_courses_api():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    if session["role"] == "admin":
        courses = get_all_courses_admin()
    else:
        dept_id = get_teacher_department_id(session["user_id"])
        courses = get_courses_by_department(dept_id)
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


@app.route("/api/payment/manual", methods=["POST"])
def manual_payment():
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401
    data = request.json
    student_id = get_student_id(session["user_id"])
    course_id = data["course_id"]
    payment_type = data.get("payment_type", "Registration")

    submit_manual_payment(
        student_id, 
        course_id, 
        payment_type, 
        data.get("transaction_id")
    )

    return {"status": "success", "message": "Payment submitted for verification"}


#student enroll
@app.route("/api/student/enroll", methods=["POST"])
def enroll_course_api(): # Rename to avoid conflict with imported function if any
    if "user_id" not in session:
        return {"error": "Unauthorized"}, 401

    student_id = get_student_id(session["user_id"])
    course_id = request.json["course_id"]

    enroll_in_course(student_id, course_id)

    return {"status": "success", "message": "Enrollment request submitted"}


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
@app.route("/teacher/enrollments")
def teacher_enrollments():
    if session["role"] == "admin":
        from admin import get_pending_enrollments
        enrollments = get_pending_enrollments()
    else:
        dept_id = get_teacher_department_id(session["user_id"])
        enrollments = get_pending_enrollments_by_dept(dept_id)
    return {"enrollments": enrollments}


# -------------------------------
# ADMIN: VERIFY ENROLLMENT
# -------------------------------
@app.route("/teacher/enrollments/verify/<int:enrollment_id>", methods=["POST"])
def teacher_verify_enrollment(enrollment_id):
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    verify_enrollment_teacher(enrollment_id)
    return {"status": "Enrollment verified"}


# -------------------------------
# ADMIN: REJECT ENROLLMENT
# -------------------------------
@app.route("/teacher/enrollments/reject/<int:enrollment_id>", methods=["POST"])
def teacher_reject_enrollment(enrollment_id):
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    reject_enrollment(enrollment_id)
    return {"status": "Enrollment rejected"}


# -------------------------------
# ADMIN: PENDING PAYMENTS
# -------------------------------
@app.route("/teacher/payments")
def teacher_payments():
    if session["role"] == "admin":
        payments = get_all_payments()
    else:
        dept_id = get_teacher_department_id(session["user_id"])
        from teacher import get_all_payments_by_dept
        payments = get_all_payments_by_dept(dept_id)
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
@app.route("/teacher/payments/verify/<int:payment_id>", methods=["POST"])
def teacher_verify_payment(payment_id):
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    verify_payment_teacher(payment_id)
    return {"status": "Payment verified"}


# -------------------------------
# ADMIN: REJECT PAYMENT
# -------------------------------
@app.route("/teacher/payments/reject/<int:payment_id>", methods=["POST"])
def teacher_reject_payment(payment_id):
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401

    reject_payment(payment_id)
    return {"status": "Payment rejected"}


# -------------------------------
# ADMIN: REGISTRATIONS API
# -------------------------------
@app.route("/teacher/registrations")
def teacher_registrations():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401
    
    return {"registrations": get_all_registrations()}

@app.route("/teacher/performance")
def teacher_performance():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401
    
    if session["role"] == "admin":
        perf = get_department_performance(None)
    else:
        dept_id = get_teacher_department_id(session["user_id"])
        perf = get_department_performance(dept_id)
    return {"performance": perf}


# -------------------------------
# ADMIN: EXAMS API
# -------------------------------
@app.route("/teacher/exams")
def teacher_exams_api():
    if "user_id" not in session or session["role"] not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401
    
    return {"exams": get_all_exams()}


@app.route("/exam/<int:exam_id>")
def exam_page(exam_id):
    if "user_id" not in session or session.get("role") != "student":
        return redirect("/")
    # fetch student_id for the UI
    student_id = get_student_id(session["user_id"])
    return render_template("exam.html", exam_id=exam_id, student_id=student_id)


@app.route("/api/exam/<int:exam_id>/start", methods=["POST"])
def api_exam_start(exam_id):
    if "user_id" not in session or session.get("role") != "student":
        return {"error": "Unauthorized"}, 401

    student_id = get_student_id(session["user_id"])
    
    # Check if student is allowed to take this exam
    if not check_exam_eligibility(student_id, exam_id):
        return {"error": "Eligibility check failed. Ensure you are Enrolled & Active for this course."}, 403

    attempt_id = create_exam_attempt(student_id, exam_id)
    qs = get_exam_questions(exam_id)

    from admin import get_exam_time_limit
    tl = get_exam_time_limit(exam_id)

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

    save_student_answer(attempt_id, q_no, selected)
    return {"status": "saved"}


@app.route("/api/exam/attempt/<int:attempt_id>/submit", methods=["POST"])
def api_exam_submit(attempt_id):
    if "user_id" not in session or session.get("role") != "student":
        return {"error": "Unauthorized"}, 401

    data = request.json or {}
    duration = int(data.get("duration_seconds", 0))
    finalize_exam_attempt(attempt_id, duration)
    result = evaluate_exam(attempt_id)
    return {"status": "submitted", "result": result}


# -------------------------------
# ADMIN: ADD EXAM
# -------------------------------
from werkzeug.utils import secure_filename
import os

UPLOAD_FOLDER = "app/static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/teacher/add-exam", methods=["GET", "POST"])
def add_exam_route():
    if session.get("role") not in ["admin", "teacher"]:
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

        return redirect("/teacher")

    from admin import get_all_courses
    course = get_all_courses()

    return render_template("add_exam.html", course=course)


# -------------------------------
# ADMIN: DELETE EXAM
# -------------------------------
@app.route("/teacher/delete-exam/<int:id>", methods=["POST"])
def delete_exam_route(id):
    if session.get("role") not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401
    
    delete_exam(id)
    return {"success": True}


# -------------------------------
# ADMIN: ADD STUDENT
# -------------------------------
@app.route("/teacher/add-student", methods=["GET", "POST"])
def add_student_teacher():
    if session.get("role") not in ["admin", "teacher"]:
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
        age = request.form.get("age", 0)
        address = request.form.get("address", "")
        institute_name = request.form.get("institute_name", "")
        
        from admin import add_student
        add_student(username, password, name, email, phone, gender, course, department, year, age, address, institute_name)

        return redirect("/teacher")

    return render_template("add_student.html")


# -------------------------------
# ADMIN: EDIT STUDENT
# -------------------------------
@app.route("/teacher/edit-student/<int:id>", methods=["GET", "POST"])
def edit_student_teacher(id):
    if session.get("role") not in ["admin", "teacher"]:
        return redirect("/")
    from admin import update_student, get_student_by_id

    if request.method == "POST":
        update_student(id, request.form)
        return redirect("/teacher")

    student = get_student_by_id(id)

    return render_template("edit_student.html", student=student)


# -------------------------------
# ADMIN: DELETE STUDENT
# -------------------------------
@app.route("/teacher/delete-student/<int:id>", methods=["POST"])
def delete_student_teacher(id):
    if session.get("role") not in ["admin", "teacher"]:
        return {"error": "Unauthorized"}, 401
    from admin import delete_student
    delete_student(id)

    return {"success": True}


# -------------------------------
# ADMIN: UPDATE PROFILE
# -------------------------------
@app.route("/teacher/update", methods=["GET", "POST"])
def admin_update_as_teacher():
    if session.get("role") not in ["admin", "teacher"]:
        return redirect("/")

    role = session.get("role")
    username = session.get("username")

    if request.method == "POST":
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        hashed = None
        if new_password:
            if new_password != confirm_password:
                return "Passwords do not match"
            hashed = generate_password_hash(new_password)

        if role == "admin":
            update_admin_profile(username, request.form, hashed)
        else:
            update_teacher_profile(username, request.form)
            # handle password update for teacher if hashed provided
            if hashed:
                # Update password in users table
                db = get_db_connection()
                cur = db.cursor()
                cur.execute("UPDATE users SET password=%s WHERE username=%s", (hashed, username))
                db.commit()
                cur.close()
                db.close()

        return redirect("/teacher")

    if role == "admin":
        admin = get_admin_profile_by_username(username)
        return render_template("admin_update_profile.html", admin=admin, role=role)
    else:
        teacher = get_teacher_profile_by_username(username)
        # Reuse admin_update_profile.html but adapted for teacher? 
        # Or use a dedicated teacher_update_profile.html?
        # User said "consolidate admin into teacher role".
        # Let's see if we can use the same template but with 'teacher' data.
        return render_template("admin_update_profile.html", admin=teacher, role=role)


# -------------------------------
# ADMIN: ADD COURSE
# -------------------------------
@app.route("/teacher/add-course", methods=["GET", "POST"])
def add_course_route_as_teacher():
    if session.get("role") not in ["admin", "teacher"]:
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

        return redirect("/teacher")

    return render_template("add_courses.html")


# -------------------------------
# ADMIN: EDIT COURSE
# -------------------------------
@app.route("/teacher/edit-course/<int:id>", methods=["GET", "POST"])
def edit_course_route_as_teacher(id):
    if session.get("role") not in ["admin", "teacher"]:
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

        return redirect("/teacher")

    course = get_course_by_id(id)
    return render_template("edit_courses.html", course=course)


# -------------------------------
# ADMIN: DELETE COURSE
# -------------------------------
@app.route("/teacher/delete-course/<int:id>", methods=["POST"])
def delete_course_route_as_teacher(id):
    if session.get("role") not in ["admin", "teacher"]:
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



