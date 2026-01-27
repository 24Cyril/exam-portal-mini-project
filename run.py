from flask import Flask, request, redirect, render_template
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, template_folder="app/templates", static_folder="app/static")

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
# HOME (LOGIN)
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
        role = request.form["role"]

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, hashed_password, role)
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

    # ✅ ROLE BASED REDIRECT
    if user["role"] == "admin":
        return redirect("/admin")
    else:
        return redirect("/student")

# -------------------------------
# STUDENT PAGE
# -------------------------------
@app.route("/student")
def student_dashboard():
    return render_template("student.html")

# -------------------------------
# ADMIN PAGE
# -------------------------------
@app.route("/admin")
def admin_dashboard():
    return render_template("admin.html")

# -------------------------------
# RUN SERVER
# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
