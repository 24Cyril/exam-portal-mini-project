import mysql.connector

def run_sql_script(filename):
    con = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
        use_pure=True
    )
    cursor = con.cursor()
    
    with open(filename, 'rb') as f:
        content = f.read()
    try:
        sql = content.decode('utf-16')
    except:
        sql = content.decode('utf-8')

    # Split by semicolon, but handle potential issues with nested semicolons (rare in this schema)
    commands = sql.split(';')
    
    for command in commands:
        cmd = command.strip()
        if not cmd:
            continue
        try:
            cursor.execute(cmd)
            # print(f"Executed: {cmd[:50]}...")
        except Exception as e:
            print(f"Error executing: {cmd[:100]}\nError: {e}")
            con.rollback()
    
    con.commit()
    cursor.close()
    con.close()
    print("Database schema successfully applied.")

if __name__ == "__main__":
    run_sql_script(r'c:\Users\anna\projects\exam-portal-mini-project\db.sql')
