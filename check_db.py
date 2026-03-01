import mysql.connector

def check_schema():
    con = mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="123",
        database="project",
        use_pure=True
    )
    cursor = con.cursor()
    
    tables = ['users', 'admin', 'student', 'teacher', 'department', 'branch']
    for table in tables:
        print(f"\n--- {table.upper()} ---")
        try:
            cursor.execute(f"DESC {table}")
            for row in cursor:
                print(f"{row[0]} ({row[1]})")
        except:
            print(f"Table {table} not found.")

    con.close()

if __name__ == "__main__":
    check_schema()
