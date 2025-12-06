import csv
import json
import re
import sqlite3
from base64 import b64decode
from datetime import timedelta
from io import StringIO
from os import makedirs
from os.path import join, exists

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    get_jwt_identity,
    create_access_token,
    jwt_required,
)

DB_DIR = "db"
VALID_KEYS_DB = join(DB_DIR, "valid_keys.db")


class RentalNotFoundException(Exception):
    pass


class InvalidStudentEncoding(Exception):
    pass


class InvalidDatabaseName(Exception):
    pass


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "secret"  # TODO: move to env var in production
jwt = JWTManager(app)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://tracer.dedyn.io",
                "http://localhost:5173",
                "http://192.168.1.87:5173",
                "http://10.0.0.131:5173",
            ],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)


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
                                                  status TEXT NOT NULL
            )
            """
        )

        conn.commit()


def decode_student(student_b64: str) -> str:
    try:
        return b64decode(student_b64).decode("utf-8")
    except Exception:
        raise InvalidStudentEncoding("Invalid base64-encoded student value")


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

        cursor.execute(
            """
            UPDATE status SET status = ? WHERE rental = ?
            """,
            (new_status, rental),
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
                "INSERT INTO status (rental, status) VALUES (?, ?)",
                (rental, "IN"),
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


@app.route("/api/link", methods=["POST"])
def link():
    if not request.is_json:
        return jsonify(error="Request must be JSON"), 400

    data = request.get_json()
    key = data.get("key")

    if not key or not valid(key):
        return jsonify(error="Invalid key"), 400

    # Ensure DB/tables exist for this key
    ensure_table(key)

    expires = timedelta(days=365)
    token = create_access_token(identity=key, expires_delta=expires)
    return jsonify(token=token), 200


@app.route("/api/write", methods=["POST"])
@jwt_required()
def write_log():
    if not request.is_json:
        return jsonify(error="Expecting JSON"), 400

    data = request.get_json()
    db_name = get_jwt_identity()

    required_fields = ["rental", "student", "date", "time"]
    missing = [f for f in required_fields if f not in data]

    if missing:
        return jsonify(error=f"Missing fields: {', '.join(missing)}"), 400

    try:
        write_entry(
            db_name,
            data["rental"],
            data["student"],
            data["date"],
            data["time"],
        )
        return jsonify(message="Log entry created successfully"), 201

    except RentalNotFoundException:
        return jsonify(error="rental does not exist"), 404

    except InvalidStudentEncoding:
        return jsonify(error="Invalid student encoding"), 400

    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400

    except Exception as e:
        return jsonify(error=f"Unexpected error: {str(e)}"), 500


@app.route("/api/rentals/add", methods=["POST"])
@jwt_required()
def add():
    if not request.is_json:
        return jsonify(error="Expecting JSON"), 400

    data = request.get_json()
    db_name = get_jwt_identity()

    rental_block = data.get("rentals")
    if rental_block is None:
        return jsonify(error="Missing rental parameter"), 400

    rentals = data.get("rentals", [])

    try:
        add_rental(db_name, rentals)
        return jsonify(message="Rental(s) created successfully"), 201

    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed" in str(e):
            return jsonify(error="Duplicate rental"), 400
        return jsonify(error=f"Integrity error: {str(e)}"), 400
    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Unexpected error: {str(e)}"), 500


@app.route("/api/rentals/remove", methods=["POST"])
@jwt_required()
def remove():
    if not request.is_json:
        return jsonify(error="Expecting JSON"), 400

    data = request.get_json()
    db_name = get_jwt_identity()

    rental = data.get("rental")
    if rental is None:
        return jsonify(error="Missing rental parameter"), 400

    try:
        remove_rental(db_name, rental)
        return jsonify(message="ok"), 200
    except RentalNotFoundException:
        return jsonify(error="Rental not found"), 404
    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Unexpected error: {str(e)}"), 500


@app.route("/api/logs", methods=["GET"])
@jwt_required()
def get_logs():
    try:
        db_name = get_jwt_identity()
        db_path = db_path_from_name(db_name)

        with sqlite3.connect(db_path) as conn:
            conn.text_factory = str
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM logs")
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()

        logs = [dict(zip(columns, row)) for row in rows]
        return jsonify(logs=logs), 200

    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Failed to fetch logs: {str(e)}"), 500


@app.route("/api/status", methods=["GET"])
@jwt_required()
def get_status():
    try:
        db_name = get_jwt_identity()
        db_path = db_path_from_name(db_name)

        with sqlite3.connect(db_path) as conn:
            conn.text_factory = str
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM status")
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()

        status_list = [dict(zip(columns, row)) for row in rows]
        return jsonify(status=status_list), 200

    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Failed to fetch status: {str(e)}"), 500


@app.route("/api/export", methods=["GET"])
@jwt_required()
def export_logs():
    try:
        db_name = get_jwt_identity()
        db_path = db_path_from_name(db_name)

        with sqlite3.connect(db_path) as conn:
            conn.text_factory = str
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM logs")
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        writer.writerows(rows)
        output.seek(0)

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={
                "Content-Disposition": f"attachment;filename={db_name}_logs.csv"
            },
        )

    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Failed to export logs: {str(e)}"), 500


@app.route("/api/clear", methods=["GET"])
@jwt_required()
def clear_logs():
    try:
        db_name = get_jwt_identity()
        db_path = db_path_from_name(db_name)

        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM logs")
            cursor.execute('UPDATE sqlite_sequence SET seq = 0 WHERE name = \'logs\'')
            conn.commit()

        return jsonify(message="Logs cleared"), 200

    except InvalidDatabaseName:
        return jsonify(error="Invalid database name"), 400
    except Exception as e:
        return jsonify(error=f"Failed to clear logs: {str(e)}"), 500


@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify(error="Missing or invalid Authorization header", description=str(error)), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify(error="Invalid token", description=str(error)), 401


if __name__ == "__main__":
    ensure_db_dir()
    app.run(host="0.0.0.0", port=9998, debug=True)
