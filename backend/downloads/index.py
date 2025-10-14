'''
Business: Управление загрузками пользователя - добавление, получение, удаление файлов
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с данными загрузок
'''

import json
import os
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not found')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    if method == 'GET':
        return get_downloads(user_id)
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        return add_download(user_id, body_data)
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        return update_download(user_id, body_data)
    elif method == 'DELETE':
        query_params = event.get('queryStringParameters', {})
        download_id = query_params.get('id')
        return delete_download(user_id, download_id)
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }

def get_downloads(user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, file_name, file_url, file_size, file_type, download_status, 
                   progress, download_speed, time_remaining, created_at, completed_at,
                   is_installed, installed_at
            FROM downloads
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))
        
        downloads = cur.fetchall()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'downloads': [dict(d) for d in downloads]
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def add_download(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    file_name = data.get('file_name')
    file_url = data.get('file_url')
    file_size = data.get('file_size')
    file_type = data.get('file_type')
    
    if not file_name or not file_url:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите название и URL файла'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        now = datetime.utcnow()
        
        cur.execute("""
            INSERT INTO downloads (user_id, file_name, file_url, file_size, file_type, 
                                 download_status, progress, created_at, completed_at, is_installed)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, file_name, file_url, file_size, file_type, download_status, 
                      progress, created_at, completed_at, is_installed
        """, (user_id, file_name, file_url, file_size, file_type, 'completed', 100, now, now, False))
        
        download = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'download': dict(download)
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def update_download(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    download_id = data.get('id')
    is_installed = data.get('is_installed')
    
    if not download_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите ID загрузки'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if is_installed is not None:
            installed_at = datetime.utcnow() if is_installed else None
            cur.execute("""
                UPDATE downloads 
                SET is_installed = %s, installed_at = %s
                WHERE id = %s AND user_id = %s
                RETURNING id, file_name, is_installed, installed_at
            """, (is_installed, installed_at, download_id, user_id))
        
        download = cur.fetchone()
        
        if not download:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Загрузка не найдена'})
            }
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'download': dict(download)}, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def delete_download(user_id: str, download_id: str) -> Dict[str, Any]:
    if not download_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите ID загрузки'})
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id FROM downloads WHERE id = %s AND user_id = %s
        """, (download_id, user_id))
        
        if not cur.fetchone():
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Загрузка не найдена'})
            }
        
        cur.execute("UPDATE downloads SET download_status = 'deleted' WHERE id = %s", (download_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
    
    finally:
        cur.close()
        conn.close()