'''
Business: NikMail email system - send, receive, list emails for users
Args: event - dict with httpMethod, body, queryStringParameters, headers
      context - object with request_id, function_name, function_version
Returns: HTTP response dict with statusCode, headers, body
'''

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

DSN = os.environ.get('DATABASE_URL')

def get_db_connection():
    return psycopg2.connect(DSN, cursor_factory=RealDictCursor)

def verify_session(session_token: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT u.id, u.email, u.phone, u.nikmail, u.display_name, u.avatar_url
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.session_token = %s AND s.expires_at > CURRENT_TIMESTAMP
    """, (session_token,))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    return dict(user) if user else None

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
    
    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Требуется авторизация'})
        }
    
    user = verify_session(session_token)
    if not user:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Сессия истекла'})
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        folder = params.get('folder', 'inbox')
        limit = int(params.get('limit', '50'))
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if folder == 'inbox':
            cur.execute("""
                SELECT id, from_email, from_name, to_email, subject, body, 
                       is_read, is_starred, is_archived, created_at, read_at
                FROM emails
                WHERE user_id = %s AND is_archived = FALSE
                ORDER BY created_at DESC
                LIMIT %s
            """, (user['id'], limit))
        elif folder == 'starred':
            cur.execute("""
                SELECT id, from_email, from_name, to_email, subject, body, 
                       is_read, is_starred, is_archived, created_at, read_at
                FROM emails
                WHERE user_id = %s AND is_starred = TRUE AND is_archived = FALSE
                ORDER BY created_at DESC
                LIMIT %s
            """, (user['id'], limit))
        elif folder == 'archived':
            cur.execute("""
                SELECT id, from_email, from_name, to_email, subject, body, 
                       is_read, is_starred, is_archived, created_at, read_at
                FROM emails
                WHERE user_id = %s AND is_archived = TRUE
                ORDER BY created_at DESC
                LIMIT %s
            """, (user['id'], limit))
        else:
            cur.execute("""
                SELECT id, from_email, from_name, to_email, subject, body, 
                       is_read, is_starred, is_archived, created_at, read_at
                FROM emails
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user['id'], limit))
        
        emails = [dict(row) for row in cur.fetchall()]
        
        for email in emails:
            if email.get('created_at'):
                email['created_at'] = email['created_at'].isoformat()
            if email.get('read_at'):
                email['read_at'] = email['read_at'].isoformat()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'emails': emails})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if action == 'send':
            to_email = body_data.get('to_email')
            subject = body_data.get('subject', '')
            body_text = body_data.get('body', '')
            
            if not to_email:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Укажите получателя'})
                }
            
            if to_email.endswith('@nikmail.ru'):
                recipient_nikmail = to_email
                cur.execute("SELECT id FROM users WHERE nikmail = %s", (recipient_nikmail,))
                recipient = cur.fetchone()
                
                if recipient:
                    cur.execute("""
                        INSERT INTO emails (user_id, from_email, from_name, to_email, subject, body, is_read, is_starred, is_archived, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP)
                        RETURNING id
                    """, (
                        recipient['id'],
                        user['nikmail'],
                        user.get('display_name') or user['nikmail'].split('@')[0],
                        to_email,
                        subject,
                        body_text
                    ))
                    conn.commit()
            
            cur.execute("""
                INSERT INTO emails (user_id, from_email, from_name, to_email, subject, body, is_read, is_starred, is_archived, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, FALSE, FALSE, CURRENT_TIMESTAMP)
                RETURNING id
            """, (
                user['id'],
                user['nikmail'],
                'Я',
                to_email,
                subject,
                body_text
            ))
            conn.commit()
            email_id = cur.fetchone()['id']
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Письмо отправлено', 'email_id': email_id})
            }
        
        elif action == 'mark_read':
            email_id = body_data.get('email_id')
            
            cur.execute("""
                UPDATE emails 
                SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
            """, (email_id, user['id']))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Помечено как прочитанное'})
            }
        
        elif action == 'toggle_star':
            email_id = body_data.get('email_id')
            
            cur.execute("""
                UPDATE emails 
                SET is_starred = NOT is_starred
                WHERE id = %s AND user_id = %s
                RETURNING is_starred
            """, (email_id, user['id']))
            result = cur.fetchone()
            conn.commit()
            
            is_starred = result['is_starred'] if result else False
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'is_starred': is_starred})
            }
        
        elif action == 'archive':
            email_id = body_data.get('email_id')
            
            cur.execute("""
                UPDATE emails 
                SET is_archived = TRUE
                WHERE id = %s AND user_id = %s
            """, (email_id, user['id']))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Письмо архивировано'})
            }
        
        elif action == 'system_send':
            to_nikmail = body_data.get('to_nikmail')
            subject = body_data.get('subject', '')
            body_text = body_data.get('body', '')
            from_email = body_data.get('from_email', 'system@nikmail.ru')
            from_name = body_data.get('from_name', 'NikMail Система')
            
            cur.execute("SELECT id FROM users WHERE nikmail = %s", (to_nikmail,))
            recipient = cur.fetchone()
            
            if not recipient:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Пользователь не найден'})
                }
            
            cur.execute("""
                INSERT INTO emails (user_id, from_email, from_name, to_email, subject, body, is_read, is_starred, is_archived, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, FALSE, FALSE, FALSE, CURRENT_TIMESTAMP)
                RETURNING id
            """, (
                recipient['id'],
                from_email,
                from_name,
                to_nikmail,
                subject,
                body_text
            ))
            conn.commit()
            email_id = cur.fetchone()['id']
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Письмо доставлено', 'email_id': email_id})
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Неизвестное действие'})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': False, 'error': 'Метод не поддерживается'})
    }
