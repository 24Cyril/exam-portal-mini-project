import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
        use_pure=True
    )

# -------------------------------
# EXAM START & NAVIGATION
# -------------------------------
def check_exam_eligibility(student_id, exam_id):
    """Ensure student is enrolled in the course for this exam."""
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""
        SELECT sc.status 
        FROM student_course sc
        JOIN exams e ON sc.course_id = e.course_id
        WHERE sc.student_id = %s AND e.exam_id = %s
    """, (student_id, exam_id))
    status = cursor.fetchone()
    cursor.close()
    db.close()
    return status and status[0] == 'Enrolled_Active'

def get_exam_questions(exam_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("""
        SELECT q_no, question, option_a, option_b, option_c, option_d 
        FROM exam_questions 
        WHERE exam_id = %s 
        ORDER BY q_no ASC
    """, (exam_id,))
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows

def create_exam_attempt(student_id, exam_id):
    db = get_db_connection()
    cursor = db.cursor()
    # Check if already attempted
    cursor.execute("SELECT attempt_id FROM student_attempts WHERE student_id = %s AND exam_id = %s", (student_id, exam_id))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        db.close()
        return existing[0]

    cursor.execute("INSERT INTO student_attempts (student_id, exam_id, start_time) VALUES (%s, %s, NOW())", (student_id, exam_id))
    db.commit()
    attempt_id = cursor.lastrowid
    cursor.close()
    db.close()
    return attempt_id

# -------------------------------
# DATA INTERACTION
# -------------------------------
def save_student_answer(attempt_id, q_no, selected_option):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO student_answers (attempt_id, q_no, selected_option)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE selected_option = %s
    """, (attempt_id, q_no, selected_option, selected_option))
    db.commit()
    cursor.close()
    db.close()

def finalize_exam_attempt(attempt_id, duration_seconds):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute("UPDATE student_attempts SET submitted_at = NOW(), duration_seconds = %s WHERE attempt_id = %s", (duration_seconds, attempt_id))
    db.commit()
    cursor.close()
    db.close()

# -------------------------------
# AUTO EVALUATION ENGINE
# -------------------------------
def evaluate_exam(attempt_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    # Get all responses and their correctness
    cursor.execute("""
        SELECT a.selected_option, q.correct_option, q.q_no
        FROM student_answers a
        JOIN student_attempts sa ON a.attempt_id = sa.attempt_id
        JOIN exam_questions q ON sa.exam_id = q.exam_id AND a.q_no = q.q_no
        WHERE a.attempt_id = %s
    """, (attempt_id,))
    
    responses = cursor.fetchall()
    score = 0
    total = len(responses) # or fetch total count from exam_questions
    
    for resp in responses:
        if resp['selected_option'] and resp['correct_option']:
            if resp['selected_option'].strip().upper() == resp['correct_option'].strip().upper():
                score += 1

    # Update scores in both student_attempts and student_exam_submissions for compatibility
    cursor.execute("UPDATE student_attempts SET score = %s, graded = 'Graded' WHERE attempt_id = %s", (score, attempt_id))
    
    # Finalize result entry for results tab
    cursor.execute("""
        SELECT student_id, exam_id FROM student_attempts WHERE attempt_id = %s
    """, (attempt_id,))
    meta = cursor.fetchone()
    
    if meta:
        cursor.execute("""
            INSERT INTO student_exam_submissions (student_id, exam_id, score, status)
            VALUES (%s, %s, %s, 'Evaluated')
            ON DUPLICATE KEY UPDATE score = %s, status = 'Evaluated'
        """, (meta['student_id'], meta['exam_id'], score, score))

    db.commit()
    cursor.close()
    db.close()
    return {"score": score, "total": total}
