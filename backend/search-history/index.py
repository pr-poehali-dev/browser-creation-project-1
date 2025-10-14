"""
Business: Управление историей поиска пользователей
Args: event - dict с httpMethod, body, queryStringParameters, headers
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с историей поиска или статусом операции
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_user_id_from_session(session_token: str) -> int:
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT user_id FROM sessions 
            WHERE session_token = %s AND expires_at > %s
        """, (session_token, datetime.utcnow()))
        
        result = cur.fetchone()
        if not result:
            raise ValueError('Invalid session')
        
        return result['user_id']
    finally:
        cur.close()
        conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'add':
                return add_search_history(session_token, body_data)
            elif action == 'get':
                return get_search_history(session_token, body_data)
            elif action == 'clear':
                return clear_search_history(session_token)
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            limit = int(params.get('limit', 50))
            return get_search_history(session_token, {'limit': limit})
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except ValueError as e:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def add_search_history(session_token: str, data: Dict[str, Any]) -> Dict[str, Any]:
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'})
        }
    
    search_query = data.get('search_query', '').strip()
    search_engine = data.get('search_engine', 'google')
    is_incognito = data.get('is_incognito', False)
    
    if not search_query:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Search query required'})
        }
    
    if is_incognito:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Incognito mode - not saved'})
        }
    
    user_id = get_user_id_from_session(session_token)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO search_history (user_id, search_query, search_engine, created_at, is_incognito)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, search_query, search_engine, created_at
        """, (user_id, search_query, search_engine, datetime.utcnow(), is_incognito))
        
        result = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'history': dict(result)
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def get_search_history(session_token: str, data: Dict[str, Any]) -> Dict[str, Any]:
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'})
        }
    
    user_id = get_user_id_from_session(session_token)
    limit = data.get('limit', 50)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, search_query, search_engine, created_at
            FROM search_history
            WHERE user_id = %s AND is_incognito = false
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        
        history = cur.fetchall()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'history': [dict(h) for h in history]
            }, default=str)
        }
    
    finally:
        cur.close()
        conn.close()

def clear_search_history(session_token: str) -> Dict[str, Any]:
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Session token required'})
        }
    
    user_id = get_user_id_from_session(session_token)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("UPDATE search_history SET is_incognito = true WHERE user_id = %s", (user_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'History cleared'})
        }
    
    finally:
        cur.close()
        conn.close()
