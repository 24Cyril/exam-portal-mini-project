from flask import Flask, request, redirect, render_template, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from admin import get_admin_profile_by_username, update_admin_profile

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")
app.secret_key = "secret123"

# -------------------------------
# DATABASE CONNECTION
# -------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Jec@023",
        database="project"
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
        fname=request.form["fname"]
        email=request.form["email"]
        role = request.form["role"]

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # insert into users
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, hashed_password, role)
        )

        # auto-create admin profile
        if role.lower() == "admin":
            cursor.execute(
                "INSERT INTO admin (username, password_hash, role,full_name,email) VALUES (%s, %s, %s,%s,%s)",
                (username, hashed_password, "Admin",fname,email)
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

    if not user:
        return "User not found"

    if not check_password_hash(user["password"], password):
        return "Incorrect password"

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
    if "username" not in session or session["role"] != "admin":
        return redirect("/")

    admin = get_admin_profile_by_username(session["username"])
    return render_template("admin.html", admin=admin)


 
@app.route("/editpro")
def student_dashboard():
    return render_template("editpro.html")



# -------------------------------
# UPDATE ADMIN PROFILE
# -------------------------------
@app.route("/admin/update", methods=["GET", "POST"])
def admin_update():
    if "username" not in session or session["role"] != "admin":
        return redirect("/")

    admin = get_admin_profile_by_username(session["username"])

    if request.method == "POST":
        data = {
            "full_name": request.form["full_name"],
            "dob": request.form["dob"],
            "gender": request.form["gender"],
            "contact_number": request.form["contact_number"],
            "email": request.form["email"],
            "institute_name": request.form["institute_name"],
            "institute_code": request.form["institute_code"],
            "institute_email": request.form["institute_email"]
        }

        update_admin_profile(session["username"], data)
        return redirect("/admin")

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
