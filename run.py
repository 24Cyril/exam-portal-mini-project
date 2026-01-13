from flask import Flask, render_template, request, redirect
import mysql.connector
from werkzeug.security import generate_password_hash

app = Flask(__name__)

# 🔗 MySQL connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="YOUR_MYSQL_PASSWORD",
        database="project"
    )

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        hashed_password = generate_password_hash(password)

        db = get_db_connection()
        cursor = db.cursor()

        try:
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (%s, %s)",
                (username, hashed_password)
            )
            db.commit()
        except mysql.connector.Error as err:
            return f"Error: {err}"
        finally:
            cursor.close()
            db.close()

        return redirect('/')

    return render_template('register.html')

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
