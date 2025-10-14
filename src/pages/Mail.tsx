import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MAIL_API = 'https://functions.poehali.dev/0eb93557-9a24-403f-b222-fdbfbed32c54';

interface Email {
  id: number;
  from_email: string;
  from_name?: string;
  to_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
  read_at?: string;
}

interface User {
  id?: number;
  email?: string;
  phone?: string;
  nikmail: string;
  display_name?: string;
  avatar_url?: string;
}

const Mail = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nikbrowser_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [sessionToken] = useState<string | null>(() => {
    return localStorage.getItem('nikbrowser_session');
  });
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [folder, setFolder] = useState<'inbox' | 'starred' | 'archived'>('inbox');
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [darkMode] = useState(() => {
    const saved = localStorage.getItem('nikbrowser_darkmode');
    return saved === 'true';
  });
  
  const [composeForm, setComposeForm] = useState({
    to_email: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    if (!user || !sessionToken) {
      navigate('/');
      return;
    }
    loadEmails();
  }, [folder, user, sessionToken, navigate]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MAIL_API}?folder=${folder}&limit=100`, {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken!
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!composeForm.to_email || !composeForm.subject) {
      alert('Заполните получателя и тему письма');
      return;
    }

    try {
      const response = await fetch(MAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!
        },
        body: JSON.stringify({
          action: 'send',
          to_email: composeForm.to_email,
          subject: composeForm.subject,
          body: composeForm.body
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowCompose(false);
        setComposeForm({ to_email: '', subject: '', body: '' });
        loadEmails();
        alert('✅ Письмо отправлено!');
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      alert('❌ Ошибка при отправке письма');
    }
  };

  const markAsRead = async (emailId: number) => {
    try {
      await fetch(MAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!
        },
        body: JSON.stringify({
          action: 'mark_read',
          email_id: emailId
        })
      });
      
      loadEmails();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const toggleStar = async (emailId: number) => {
    try {
      await fetch(MAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!
        },
        body: JSON.stringify({
          action: 'toggle_star',
          email_id: emailId
        })
      });
      
      loadEmails();
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const archiveEmail = async (emailId: number) => {
    try {
      await fetch(MAIL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken!
        },
        body: JSON.stringify({
          action: 'archive',
          email_id: emailId
        })
      });
      
      setSelectedEmail(null);
      loadEmails();
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const openEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      markAsRead(email.id);
    }
  };

  const unreadCount = emails.filter(e => !e.is_read).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode
        ? 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: darkMode ? '#2d2d44' : 'white',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: darkMode ? 'white' : '#333',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ← 
          </button>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: 0,
            color: darkMode ? 'white' : '#333'
          }}>
            📧 NikMail
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '14px',
            color: darkMode ? '#999' : '#666',
            fontWeight: '600'
          }}>
            {user?.nikmail}
          </div>
          <button
            onClick={() => setShowCompose(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ✉️ Написать
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          width: '240px',
          background: darkMode ? '#2d2d44' : '#f9f9f9',
          borderRight: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0',
          padding: '24px 16px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => {
              setFolder('inbox');
              setSelectedEmail(null);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '8px',
              background: folder === 'inbox' 
                ? (darkMode ? '#3a3a4e' : 'white') 
                : 'transparent',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: darkMode ? 'white' : '#333',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>📥 Входящие</span>
            {unreadCount > 0 && (
              <span style={{
                background: '#667eea',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setFolder('starred');
              setSelectedEmail(null);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '8px',
              background: folder === 'starred' 
                ? (darkMode ? '#3a3a4e' : 'white') 
                : 'transparent',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: darkMode ? 'white' : '#333',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            ⭐ Помеченные
          </button>

          <button
            onClick={() => {
              setFolder('archived');
              setSelectedEmail(null);
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '8px',
              background: folder === 'archived' 
                ? (darkMode ? '#3a3a4e' : 'white') 
                : 'transparent',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: darkMode ? 'white' : '#333',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            📦 Архив
          </button>
        </div>

        <div style={{
          width: selectedEmail ? '350px' : '400px',
          background: darkMode ? '#25253a' : 'white',
          borderRight: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0',
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: darkMode ? '#999' : '#666'
            }}>
              Загрузка...
            </div>
          ) : emails.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: darkMode ? '#999' : '#666',
              padding: '20px'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>Нет писем</div>
            </div>
          ) : (
            emails.map(email => (
              <div
                key={email.id}
                onClick={() => openEmail(email)}
                style={{
                  padding: '16px 20px',
                  borderBottom: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0',
                  cursor: 'pointer',
                  background: selectedEmail?.id === email.id
                    ? (darkMode ? '#3a3a4e' : '#f5f5f5')
                    : 'transparent',
                  position: 'relative'
                }}
              >
                {!email.is_read && (
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#667eea'
                  }} />
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontWeight: email.is_read ? '500' : '700',
                    fontSize: '15px',
                    color: darkMode ? 'white' : '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {email.from_name || email.from_email}
                  </div>
                  {email.is_starred && <span style={{ fontSize: '16px' }}>⭐</span>}
                </div>
                
                <div style={{
                  fontWeight: email.is_read ? '400' : '600',
                  fontSize: '14px',
                  color: darkMode ? '#ccc' : '#555',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {email.subject || '(без темы)'}
                </div>
                
                <div style={{
                  fontSize: '13px',
                  color: darkMode ? '#999' : '#888',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {email.body.substring(0, 60)}...
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: darkMode ? '#777' : '#aaa',
                  marginTop: '8px'
                }}>
                  {new Date(email.created_at).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          flex: 1,
          background: darkMode ? '#1e1e2e' : '#f9f9f9',
          overflowY: 'auto',
          padding: '32px'
        }}>
          {selectedEmail ? (
            <div>
              <div style={{
                marginBottom: '24px',
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => toggleStar(selectedEmail.id)}
                  style={{
                    padding: '10px 16px',
                    background: darkMode ? '#3a3a4e' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: darkMode ? 'white' : '#333'
                  }}
                >
                  {selectedEmail.is_starred ? '⭐ Убрать' : '☆ Пометить'}
                </button>
                
                <button
                  onClick={() => archiveEmail(selectedEmail.id)}
                  style={{
                    padding: '10px 16px',
                    background: darkMode ? '#3a3a4e' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: darkMode ? 'white' : '#333'
                  }}
                >
                  📦 Архивировать
                </button>

                <button
                  onClick={() => {
                    setShowCompose(true);
                    setComposeForm({
                      to_email: selectedEmail.from_email,
                      subject: `Re: ${selectedEmail.subject}`,
                      body: `\n\n--- Исходное письмо ---\nОт: ${selectedEmail.from_email}\nТема: ${selectedEmail.subject}\n\n${selectedEmail.body}`
                    });
                  }}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  ↩️ Ответить
                </button>
              </div>

              <div style={{
                background: darkMode ? '#2d2d44' : 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  marginBottom: '24px',
                  paddingBottom: '24px',
                  borderBottom: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    margin: '0 0 16px 0',
                    color: darkMode ? 'white' : '#333'
                  }}>
                    {selectedEmail.subject || '(без темы)'}
                  </h2>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}>
                      {(selectedEmail.from_name || selectedEmail.from_email).charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '15px',
                        color: darkMode ? 'white' : '#333'
                      }}>
                        {selectedEmail.from_name || selectedEmail.from_email}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: darkMode ? '#999' : '#666'
                      }}>
                        {selectedEmail.from_email}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: darkMode ? '#999' : '#888',
                    marginLeft: '52px'
                  }}>
                    Кому: {selectedEmail.to_email}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: darkMode ? '#777' : '#aaa',
                    marginLeft: '52px',
                    marginTop: '4px'
                  }}>
                    {new Date(selectedEmail.created_at).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: darkMode ? '#ccc' : '#333',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: darkMode ? '#999' : '#666'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>📬</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                Выберите письмо для чтения
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowCompose(false)}>
          <div style={{
            background: darkMode ? '#2d2d44' : 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                color: darkMode ? 'white' : '#333'
              }}>
                ✉️ Новое письмо
              </h2>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: darkMode ? '#999' : '#666'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Кому
                </label>
                <input
                  type="email"
                  value={composeForm.to_email}
                  onChange={(e) => setComposeForm({ ...composeForm, to_email: e.target.value })}
                  placeholder="example@nikmail.ru"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    border: darkMode ? '1px solid #444' : '1px solid #ddd',
                    borderRadius: '8px',
                    background: darkMode ? '#3a3a4e' : '#f9f9f9',
                    color: darkMode ? 'white' : '#333',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Тема
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Тема письма"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    border: darkMode ? '1px solid #444' : '1px solid #ddd',
                    borderRadius: '8px',
                    background: darkMode ? '#3a3a4e' : '#f9f9f9',
                    color: darkMode ? 'white' : '#333',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Сообщение
                </label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Текст письма..."
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    border: darkMode ? '1px solid #444' : '1px solid #ddd',
                    borderRadius: '8px',
                    background: darkMode ? '#3a3a4e' : '#f9f9f9',
                    color: darkMode ? 'white' : '#333',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button
                onClick={sendEmail}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mail;
