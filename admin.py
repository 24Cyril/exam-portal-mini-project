import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123",
        database="project"
    )

# -------------------------------
# FETCH ADMIN PROFILE
# -------------------------------
def get_admin_profile_by_username(username):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM admin WHERE username = %s",
        (username,)
    )

    admin = cursor.fetchone()

    cursor.close()
    db.close()
    return admin


# -------------------------------
# UPDATE ADMIN PROFILE
# -------------------------------
def update_admin_profile(username, data):
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("""
        UPDATE admin
        SET full_name=%s,
            dob=%s,
            gender=%s,
            contact_number=%s,
            email=%s,
            institute_name=%s,
            institute_code=%s,
            institute_email=%s
        WHERE username=%s
    """, (
        data["full_name"],
        data["dob"],
        data["gender"],
        data["contact_number"],
        data["email"],
        data["institute_name"],
        data["institute_code"],
        data["institute_email"],
        username
    ))

    db.commit()
    cursor.close()
    db.close()
