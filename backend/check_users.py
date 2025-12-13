from models import SessionLocal, User

try:
    db = SessionLocal()
    users = db.query(User).all()
    print(f"--- DATABASE USER CHECK ---")
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: {u.email} (ID: {u.id})")
    print(f"---------------------------")
    db.close()
except Exception as e:
    print(f"DB Error: {e}")
