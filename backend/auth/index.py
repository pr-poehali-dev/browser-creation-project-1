"""
Business: Регистрация и авторизация пользователей NikBrowser
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными пользователя или ошибкой
"""

import json
import os
import hashlib
import secrets
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def generate_nikmail(email: Optional[str], phone: Optional[str]) -> str:
    if email:
        base = email.split('@')[0]
    elif phone:
        base = phone.replace('+', '').replace('-', '').replace(' ', '')[-6:]
    else:
        base = secrets.token_hex(4)
    
    random_suffix = secrets.token_hex(2)
    return f"{base}{random_suffix}@nikmail.ru"

def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone.replace(' ', '').replace('-', '')))

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                return register_user(body_data)
            elif action == 'login':
                return login_user(body_data)
            elif action == 'verify_session':
                return verify_session(body_data)
            elif action == 'logout':
                return logout_user(body_data)
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def register_user(data: Dict[str, Any]) -> Dict[str, Any]:
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')
    display_name = data.get('display_name', '')
    
    if not password or len(password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен содержать минимум 6 символов'})
        }
    
    if not email and not phone:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите email или номер телефона'})
        }
    
    if email and not validate_email(email):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Некорректный email'})
        }
    
    if phone and not validate_phone(phone):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Некорректный номер телефона'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if email:
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'})
                }
        
        if phone:
            cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Телефон уже зарегистрирован'})
                }
        
        password_hash = hash_password(password)
        nikmail = generate_nikmail(email, phone)
        
        cur.execute("""
            INSERT INTO users (email, phone, password_hash, nikmail, display_name, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, email, phone, nikmail, display_name, created_at
        """, (email, phone, password_hash, nikmail, display_name, datetime.utcnow(), datetime.utcnow()))
        
        user = cur.fetchone()
        user_id = user['id']
        
        session_token = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        cur.execute("""
            INSERT INTO sessions (user_id, session_token, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, session_token, expires_at, datetime.utcnow()))
        
        cur.execute("""
            INSERT INTO user_settings (user_id, dark_mode, default_search_engine, updated_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, False, 'google', datetime.utcnow()))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': dict(user),
                'session_token': session_token,
                'expires_at': expires_at.isoformat()
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def login_user(data: Dict[str, Any]) -> Dict[str, Any]:
    login_input = data.get('login')
    password = data.get('password')
    
    if not login_input or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите логин и пароль'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        password_hash = hash_password(password)
        
        cur.execute("""
            SELECT id, email, phone, nikmail, display_name, avatar_url, created_at
            FROM users
            WHERE (email = %s OR phone = %s) AND password_hash = %s AND is_active = true
        """, (login_input, login_input, password_hash))
        
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный логин или пароль'})
            }
        
        user_id = user['id']
        
        cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.utcnow(), user_id))
        
        session_token = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        cur.execute("""
            INSERT INTO sessions (user_id, session_token, expires_at, created_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, session_token, expires_at, datetime.utcnow()))
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': dict(user),
                'session_token': session_token,
                'expires_at': expires_at.isoformat()
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def verify_session(data: Dict[str, Any]) -> Dict[str, Any]:
    session_token = data.get('session_token')
    
    if not session_token:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT u.id, u.email, u.phone, u.nikmail, u.display_name, u.avatar_url, u.created_at, s.expires_at
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.session_token = %s AND s.expires_at > %s AND u.is_active = true
        """, (session_token, datetime.utcnow()))
        
        result = cur.fetchone()
        
        if not result:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid or expired session'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': dict(result)
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def logout_user(data: Dict[str, Any]) -> Dict[str, Any]:
    session_token = data.get('session_token')
    
    if not session_token:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("UPDATE sessions SET expires_at = %s WHERE session_token = %s", (datetime.utcnow(), session_token))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    finally:
        cur.close()
        conn.close()
