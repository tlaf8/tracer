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


class RentalNotFoundException(Exception):
    pass


app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'secret'
jwt = JWTManager(app)

CORS(app, resources={r'/*': {
    'origins': ['https://sftracer.duckdns.org', 'http://localhost:5173'],
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
            rental TEXT NOT NULL,
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
            rental TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL
        )
    ''')

    conn.commit()
    conn.close()


def write_entry(db_name, rental, student, date, time):
    flip = {'IN': 'OUT', 'OUT': 'IN'}
    ensure_table(db_name)
    conn = sqlite3.connect(f'db/{db_name}.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT status FROM status WHERE rental = ?
    ''', (rental,))

    rental_status = cursor.fetchone()
    if rental_status is None:
        conn.close()
        raise RentalNotFoundException('No rental found')

    cursor.execute(f'''
        INSERT INTO logs (rental, action, student, date, time) 
        VALUES (?, ?, ?, ?, ?)
    ''', (rental, flip[rental_status[0]], b64decode(student).decode('utf-8'), date, time))
    conn.commit()

    cursor.execute(f'''
        UPDATE status SET status = ? WHERE rental = ?
    ''', (flip[rental_status[0]], rental))
    conn.commit()

    conn.close()


def add_rental(db_name, rentals):
    ensure_table(db_name)
    conn = sqlite3.connect(f'db/{db_name}.db')
    cursor = conn.cursor()

    try:
        for rental in rentals:
            cursor.execute('''
                INSERT INTO status (rental, status)
                VALUES (?, ?)
            ''', (rental, 'IN',))
            conn.commit()

    except sqlite3.IntegrityError as e:
        conn.close()
        raise

    except (Exception,) as e:
        conn.close()
        raise


@app.route('/api/link', methods=['POST'])
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


@app.route('/api/write', methods=['POST'])
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

        required_fields = ['rental', 'student', 'date', 'time']
        if not all(key in body for key in required_fields):
            return jsonify({'error': 'Missing body parameters'}), 400

        write_entry(db_name, body['rental'], body['student'], body['date'], body['time'])
        return jsonify({'message': 'Log entry created successfully'}), 201

    except RentalNotFoundException as e:
        return jsonify({'error': 'rental does not exist'}), 400

    except (Exception,) as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/rentals/add', methods=['POST'])
@jwt_required()
def add():
    try:
        if not request.is_json:
            return jsonify({'error': 'Expecting json'}), 400

        data = request.get_json()
        body = data.get('body')
        if body is None:
            return jsonify({'error': 'No body'}), 400

        db_name = get_jwt_identity()
        if 'rental' not in body:
            return jsonify({'error': 'Missing rental parameter'}), 400

        try:
            add_rental(db_name, body['rental'].split('\n'))
        except sqlite3.IntegrityError as e:
            print(str(e))
            if 'UNIQUE constraint failed' in str(e):
                return jsonify({'error': f'Duplicate key'}), 400
            else:
                raise

        return jsonify({'message': 'rental created successfully'}), 201

    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/logs', methods=['GET'])
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


@app.route('/api/status', methods=['GET'])
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
    app.run(host='0.0.0.0', port=9998, debug=True)
