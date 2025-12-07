from exceptions import InvalidDatabaseName
from exceptions import RentalNotFoundException
from exceptions import InvalidStudentEncoding
from os import makedirs
from os.path import exists, join
from base64 import b64decode
import sqlite3
import re

DB_DIR = "db"
VALID_KEYS_DB = join(DB_DIR, "valid_keys.db")

def ensure_db_dir() -> None:
    if not exists(DB_DIR):
        makedirs(DB_DIR, exist_ok=True)

def db_path_from_name(db_name: str) -> str:
    """
    Validate and convert a logical db_name (the key) into a safe SQLite file path.
    Only allow alphanumerics, underscore, and dash.
    """
    if not re.match(r"^[A-Za-z0-9_-]+$", db_name):
        raise InvalidDatabaseName("Invalid database name")
    ensure_db_dir()
    return join(DB_DIR, f"{db_name}.db")

def decode_student(student_b64: str) -> str:
    try:
        return b64decode(student_b64).decode("utf-8")
    except Exception:
        raise InvalidStudentEncoding("Invalid base64-encoded student value")

def valid(key: str) -> bool:
    ensure_db_dir()
    # valid_keys.db is assumed to exist up-front; you can create/populate it separately.
    if not exists(VALID_KEYS_DB):
        return False

    with sqlite3.connect(VALID_KEYS_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM keys WHERE key = ?", (key,))
        result = cursor.fetchone()

    return bool(result)

def ensure_table(db_name: str) -> None:
    """
    Ensure logs/status tables exist for this key/db.
    """
    db_path = db_path_from_name(db_name)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS logs (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                rental TEXT NOT NULL,
                                                action TEXT NOT NULL,
                                                student TEXT NOT NULL,
                                                date TEXT NOT NULL,
                                                time TEXT NOT NULL
            )
            """
        )

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS status (
                                                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                  rental TEXT UNIQUE NOT NULL,
                                                  status TEXT NOT NULL,
                                                  renter TEXT NOT NULL
            )
            """
        )

        conn.commit()

def write_entry(db_name: str, rental: str, student_b64: str, date: str, time: str) -> None:
    flip = {"IN": "OUT", "OUT": "IN"}
    ensure_table(db_name)
    db_path = db_path_from_name(db_name)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT status FROM status WHERE rental = ?", (rental,))
        row = cursor.fetchone()
        if row is None:
            raise RentalNotFoundException("No rental found")

        current_status = row[0]
        if current_status not in flip:
            raise ValueError(f"Invalid status for rental: {current_status}")

        new_status = flip[current_status]
        student = decode_student(student_b64)

        cursor.execute(
            """
            INSERT INTO logs (rental, action, student, date, time)
            VALUES (?, ?, ?, ?, ?)
            """,
            (rental, new_status, student, date, time),
        )

        if new_status == "IN":
            student = ""

        cursor.execute(
            """
            UPDATE status SET status = ?, renter = ? WHERE rental = ?
            """,
            (new_status, student, rental),
        )

        conn.commit()

def add_rental(db_name: str, rentals: list[str]) -> None:
    ensure_table(db_name)
    db_path = db_path_from_name(db_name)

    cleaned = [r.strip() for r in rentals if r.strip()]
    if not cleaned:
        return

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        for rental in cleaned:
            cursor.execute(
                "INSERT INTO status (rental, status, renter) VALUES (?, ?, ?)",
                (rental, "IN", ""),
            )
        conn.commit()

def remove_rental(db_name: str, rental: str) -> None:
    ensure_table(db_name)
    db_path = db_path_from_name(db_name)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM status WHERE rental = ?", (rental,))
        if cursor.rowcount == 0:
            raise RentalNotFoundException("Rental not found")
        conn.commit()
