from flask import Flask, render_template, request, redirect
import sqlite3

app = Flask(__name__)

def get_db():
    return sqlite3.connect("database.db")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']

        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (username, password, role)
        )
        db.commit()
        db.close()

        return redirect('/')

    return render_template('register.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    role = request.form['role']

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE username=? AND password=? AND role=?",
        (username, password, role)
    )

    user = cursor.fetchone()
    db.close()

    if user:
        if role == 'admin':
            return redirect('/admin')
        else:
            return redirect('/exam')
    else:
        return "Invalid credentials"

@app.route('/exam')
def exam():
    return render_template('exam.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

if __name__ == "__main__":
    app.run(debug=True)
