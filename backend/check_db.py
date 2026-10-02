import sqlite3
import sys

conn = sqlite3.connect('dailyworks.db')
c = conn.cursor()

try:
    c.execute("SELECT id, title, start_date, time_of_day, reminder_offset_minutes, reminder_enabled FROM works ORDER BY created_at DESC LIMIT 5")
    print("Latest 5 Works:")
    for row in c.fetchall():
        print(row)
        
    print("-" * 50)
    
    c.execute("SELECT * FROM reminder_jobs")
    jobs = c.fetchall()
    print(f"Total reminder jobs: {len(jobs)}")
    for row in jobs:
        print(row)
except Exception as e:
    print("Error:", e)
finally:
    conn.close()
