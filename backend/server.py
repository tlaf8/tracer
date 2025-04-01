import json
import sqlite3
import traceback
from base64 import b64decode
from datetime import timedelta
from json import dumps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt_identity, create_access_token, jwt_required
from os.path import exists

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'tracer'
jwt = JWTManager(app)

CORS(app, resources={r'/*': {
    'origins': ['http://localhost:5173'],
    'methods': ['GET', 'POST', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization']
}})


def valid(key):
    conn = sqlite3.connect('db/valid_keys.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM keys WHERE key = ?', (key,))
    result = cursor.fetchone()
    conn.close()
    return bool(result)


# TODO: Change this to check for table existence and create only if not found
def ensure_table(db_name):
    if not exists(f'db/{db_name}.db'):
        open(f'db/{db_name}.db', 'x').close()

    conn = sqlite3.connect(f'db/{db_name}.db')
    cursor = conn.cursor()
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device TEXT NOT NULL,
            action TEXT NOT NULL,
            student TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL
        )
    ''')
    conn.commit()
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')

    conn.commit()
    conn.close()


def write_entry(db_name, device, student, date, time):
    flip = {'IN': 'OUT', 'OUT': 'IN'}
    ensure_table(db_name)
    conn = sqlite3.connect(f'db/{db_name}.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT status FROM status WHERE device = ?
    ''', (device,))

    device_status = cursor.fetchone()[0]
    if device_status is None:
        return

    cursor.execute(f'''
        INSERT INTO logs (device, action, student, date, time) 
        VALUES (?, ?, ?, ?, ?)
    ''', (device, flip[device_status], b64decode(student).decode('utf-8'), date, time))
    conn.commit()

    cursor.execute(f'''
        UPDATE status SET status = ? WHERE device = ?
    ''', (flip[device_status], device))
    conn.commit()

    conn.close()


@app.route('/link', methods=['POST'])
def link():
    if not request.is_json:
        return jsonify({'error': 'Request must be JSON'}), 400

    data = request.get_json()
    body = data.get('body')
    if isinstance(body, str):
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON in body'}), 400

    key = body.get('key')
    if key is None or not valid(key):
        return jsonify({'error': 'Invalid key'}), 400

    ensure_table(key)

    expires = timedelta(days=365)
    token = create_access_token(identity=key, expires_delta=expires)
    return jsonify({'token': token})


@app.route('/write', methods=['POST'])
@jwt_required()
def write_log():
    try:
        if not request.is_json:
            return jsonify({'error': 'Expecting json'}), 400

        data = request.get_json()

        body = data.get('body')
        if body is None:
            return jsonify({'error': 'No body'}), 400

        db_name = get_jwt_identity()

        required_fields = ['device', 'student', 'date', 'time']
        if not all(key in body for key in required_fields):
            return jsonify({'error': 'Missing body parameters'}), 400

        write_entry(db_name, body['device'], body['student'], body['date'], body['time'])
        return jsonify({'message': 'Log entry created successfully'}), 201

    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/logs', methods=['GET'])
@jwt_required()
def get_logs():
    db_name = get_jwt_identity()
    conn = sqlite3.connect(f'db/{db_name}.db')
    conn.text_factory = str
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM logs')
    columns = [description[0] for description in cursor.description]
    data = cursor.fetchall()
    conn.close()
    logs = [dict(zip(columns, row)) for row in data]
    return jsonify({'logs': logs}), 200


@app.route('/status', methods=['GET'])
@jwt_required()
def get_status():
    try:
        db_name = get_jwt_identity()
        conn = sqlite3.connect(f'db/{db_name}.db')
        conn.text_factory = str
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM status')
        columns = [description[0] for description in cursor.description]
        data = cursor.fetchall()
        conn.close()
        status = [dict(zip(columns, row)) for row in data]
        return jsonify({'status': status}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch status: {str(e)}'}), 500


@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({
        'error': 'Missing or invalid Authorization header',
        'description': str(error)
    }), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'description': str(error)
    }), 401


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9999, debug=True)
