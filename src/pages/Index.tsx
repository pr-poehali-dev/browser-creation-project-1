import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AUTH_API = 'https://functions.poehali.dev/44a8cf08-8c5f-4811-a6e2-d90d06b3b81f';
const SEARCH_HISTORY_API = 'https://functions.poehali.dev/2b513cfe-e8a0-4a7d-afc3-c574697503ca';

interface User {
  id?: number;
  email?: string;
  phone?: string;
  nikmail: string;
  display_name?: string;
  avatar_url?: string;
  created_at?: string;
}

interface Bookmark {
  name: string;
  url: string;
  icon: string;
}

interface SearchHistoryItem {
  id: number;
  search_query: string;
  search_engine: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'appearance' | 'history' | 'bookmarks' | 'advanced'>('account');
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nikbrowser_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('nikbrowser_session');
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nikbrowser_darkmode');
    return saved === 'true';
  });
  
  const [incognito, setIncognito] = useState(false);
  
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nikbrowser_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newBookmark, setNewBookmark] = useState({ name: '', url: '', icon: '⭐' });
  
  const [authForm, setAuthForm] = useState({
    email: '',
    phone: '',
    password: '',
    display_name: ''
  });
  
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      verifySession();
      loadSearchHistory();
    }
  }, [sessionToken]);

  useEffect(() => {
    localStorage.setItem('nikbrowser_darkmode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('nikbrowser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const verifySession = async () => {
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_session',
          session_token: sessionToken
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('nikbrowser_user', JSON.stringify(data.user));
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Session verification failed:', error);
    }
  };

  const loadSearchHistory = async () => {
    if (!sessionToken || incognito) return;
    
    try {
      const response = await fetch(`${SEARCH_HISTORY_API}?limit=50`, {
        method: 'GET',
        headers: {
          'X-Session-Token': sessionToken
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: authForm.email || undefined,
          phone: authForm.phone || undefined,
          password: authForm.password,
          display_name: authForm.display_name
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setSessionToken(data.session_token);
        localStorage.setItem('nikbrowser_user', JSON.stringify(data.user));
        localStorage.setItem('nikbrowser_session', data.session_token);
        setShowAuthModal(false);
        setAuthForm({ email: '', phone: '', password: '', display_name: '' });
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('Ошибка подключения к серверу');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          login: authForm.email || authForm.phone,
          password: authForm.password
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setSessionToken(data.session_token);
        localStorage.setItem('nikbrowser_user', JSON.stringify(data.user));
        localStorage.setItem('nikbrowser_session', data.session_token);
        setShowAuthModal(false);
        setAuthForm({ email: '', phone: '', password: '', display_name: '' });
      } else {
        setAuthError(data.error);
      }
    } catch (error) {
      setAuthError('Ошибка подключения к серверу');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch(AUTH_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'logout',
            session_token: sessionToken
          })
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    
    setUser(null);
    setSessionToken(null);
    setSearchHistory([]);
    localStorage.removeItem('nikbrowser_user');
    localStorage.removeItem('nikbrowser_session');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (sessionToken && !incognito) {
        try {
          await fetch(SEARCH_HISTORY_API, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': sessionToken
            },
            body: JSON.stringify({
              action: 'add',
              search_query: searchQuery.trim(),
              search_engine: 'google',
              is_incognito: incognito
            })
          });
          
          loadSearchHistory();
        } catch (error) {
          console.error('Failed to save search:', error);
        }
      }
      
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const clearHistory = async () => {
    if (sessionToken) {
      try {
        await fetch(SEARCH_HISTORY_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken
          },
          body: JSON.stringify({
            action: 'clear'
          })
        });
        
        setSearchHistory([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const addBookmark = () => {
    if (newBookmark.name.trim() && newBookmark.url.trim()) {
      setBookmarks(prev => [...prev, { ...newBookmark }]);
      setNewBookmark({ name: '', url: '', icon: '⭐' });
    }
  };

  const removeBookmark = (index: number) => {
    setBookmarks(prev => prev.filter((_, i) => i !== index));
  };

  const exportSettings = () => {
    const data = {
      bookmarks,
      darkMode,
      user,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nikbrowser-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.bookmarks) setBookmarks(data.bookmarks);
          if (typeof data.darkMode === 'boolean') setDarkMode(data.darkMode);
          alert('✅ Настройки успешно импортированы!');
        } catch (error) {
          alert('❌ Ошибка при импорте. Проверьте файл.');
        }
      };
      reader.readAsText(file);
    }
  };

  const resetAllSettings = () => {
    if (confirm('Вы уверены? Все настройки, закладки и история будут удалены!')) {
      localStorage.clear();
      setUser(null);
      setSessionToken(null);
      setDarkMode(false);
      setBookmarks([]);
      setSearchHistory([]);
      setIncognito(false);
      alert('✅ Все настройки сброшены!');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode
        ? 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        {user && (
          <button
            onClick={() => navigate('/mail')}
            style={{
              padding: '10px 16px',
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📧 Почта
          </button>
        )}

        <button
          onClick={() => setShowHistoryOverlay(true)}
          style={{
            padding: '10px 16px',
            background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📚 История
        </button>

        <button
          onClick={() => setIncognito(!incognito)}
          style={{
            padding: '10px 16px',
            background: incognito 
              ? 'linear-gradient(135deg, #434343 0%, #000000 100%)'
              : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🕶️ {incognito ? 'Инкогнито' : 'Обычный'}
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '10px 16px',
            background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <button
            onClick={() => setShowSettings(true)}
            style={{
              padding: '10px 16px',
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👤</span>
            <span>{user.display_name || user.nikmail}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            Войти
          </button>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '48px'
      }}>
        <h1 style={{
          fontSize: '64px',
          margin: '0 0 16px 0',
          color: 'white',
          fontWeight: '700',
          letterSpacing: '-2px'
        }}>
          NikBrowser
        </h1>
        <p style={{
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0
        }}>
          Ваш персональный браузер
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: '700px',
        marginBottom: '32px'
      }}>
        <div style={{
          position: 'relative',
          background: 'white',
          borderRadius: '24px',
          padding: '8px',
          boxShadow: isFocused
            ? '0 20px 60px rgba(0, 0, 0, 0.3)'
            : '0 10px 40px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={incognito ? "🕶️ Инкогнито поиск..." : "Поиск в интернете..."}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: '18px',
              border: 'none',
              outline: 'none',
              borderRadius: '16px',
              background: 'transparent'
            }}
          />
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Искать
          </button>
        </div>
      </form>

      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '700px'
      }}>
        {bookmarks.slice(0, 6).map((bookmark, index) => (
          <a
            key={index}
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '20px' }}>{bookmark.icon}</span>
            {bookmark.name}
          </a>
        ))}
      </div>

      {showHistoryOverlay && (
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
        }} onClick={() => setShowHistoryOverlay(false)}>
          <div style={{
            background: darkMode ? '#2d2d44' : 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
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
                📚 История поиска
              </h2>
              <button
                onClick={() => setShowHistoryOverlay(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: darkMode ? '#999' : '#666',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {!user ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: darkMode ? '#999' : '#666'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
                <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                  Войдите, чтобы увидеть историю
                </p>
                <button
                  onClick={() => {
                    setShowHistoryOverlay(false);
                    setShowAuthModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Войти
                </button>
              </div>
            ) : searchHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: darkMode ? '#999' : '#666'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                <p style={{ margin: 0, fontSize: '15px' }}>История пуста</p>
              </div>
            ) : (
              <>
                <button
                  onClick={clearHistory}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: darkMode ? '#3a3a4e' : '#f5f5f5',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#ff4444',
                    cursor: 'pointer',
                    marginBottom: '16px'
                  }}
                >
                  Очистить всю историю
                </button>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: darkMode ? '#3a3a4e' : '#f5f5f5',
                        borderRadius: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSearchQuery(item.search_query);
                        setShowHistoryOverlay(false);
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: darkMode ? 'white' : '#333',
                          fontSize: '15px'
                        }}>
                          {item.search_query}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: darkMode ? '#999' : '#666',
                          marginTop: '4px'
                        }}>
                          {new Date(item.created_at).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAuthModal && (
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
        }} onClick={() => setShowAuthModal(false)}>
          <div style={{
            background: darkMode ? '#2d2d44' : 'white',
            borderRadius: '24px',
            padding: '40px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px'
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: 0,
                color: darkMode ? 'white' : '#333'
              }}>
                {authMode === 'login' ? 'Вход' : 'Регистрация'}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
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

            {authError && (
              <div style={{
                padding: '12px',
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                borderRadius: '8px',
                color: '#c62828',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {authError}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
              {authMode === 'register' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: darkMode ? '#ccc' : '#666'
                  }}>
                    Имя (необязательно)
                  </label>
                  <input
                    type="text"
                    value={authForm.display_name}
                    onChange={(e) => setAuthForm({ ...authForm, display_name: e.target.value })}
                    placeholder="Ваше имя"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '15px',
                      border: darkMode ? '1px solid #444' : '1px solid #ddd',
                      borderRadius: '12px',
                      background: darkMode ? '#3a3a4e' : '#f9f9f9',
                      color: darkMode ? 'white' : '#333',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Email или Телефон
                </label>
                <input
                  type="text"
                  value={authForm.email || authForm.phone}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes('@')) {
                      setAuthForm({ ...authForm, email: value, phone: '' });
                    } else {
                      setAuthForm({ ...authForm, phone: value, email: '' });
                    }
                  }}
                  placeholder="example@mail.ru или +79991234567"
                  required
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    border: darkMode ? '1px solid #444' : '1px solid #ddd',
                    borderRadius: '12px',
                    background: darkMode ? '#3a3a4e' : '#f9f9f9',
                    color: darkMode ? 'white' : '#333',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#ccc' : '#666'
                }}>
                  Пароль
                </label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    border: darkMode ? '1px solid #444' : '1px solid #ddd',
                    borderRadius: '12px',
                    background: darkMode ? '#3a3a4e' : '#f9f9f9',
                    color: darkMode ? 'white' : '#333',
                    outline: 'none'
                  }}
                />
              </div>

              {authMode === 'register' && (
                <div style={{
                  padding: '12px',
                  background: darkMode ? 'rgba(103, 126, 234, 0.1)' : '#e3f2fd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: darkMode ? '#99aaff' : '#1976d2',
                  marginBottom: '20px'
                }}>
                  📧 После регистрации вы получите почту <strong>@nikmail.ru</strong>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  opacity: authLoading ? 0.7 : 1
                }}
              >
                {authLoading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '14px',
              color: darkMode ? '#999' : '#666'
            }}>
              {authMode === 'login' ? (
                <>
                  Нет аккаунта?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Зарегистрируйтесь
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Войдите
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
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
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            background: darkMode ? '#2d2d44' : 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '32px',
              borderBottom: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: 0,
                  color: darkMode ? 'white' : '#333'
                }}>
                  Настройки
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
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
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{
                width: '240px',
                borderRight: darkMode ? '1px solid #3a3a4e' : '1px solid #e0e0e0',
                padding: '24px',
                overflowY: 'auto'
              }}>
                {[
                  { id: 'account', label: 'Аккаунт', icon: '👤' },
                  { id: 'appearance', label: 'Внешний вид', icon: '🎨' },
                  { id: 'bookmarks', label: 'Закладки', icon: '⭐' },
                  { id: 'history', label: 'История', icon: '📚' },
                  { id: 'advanced', label: 'Дополнительно', icon: '⚙️' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id as any)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      marginBottom: '8px',
                      background: settingsTab === tab.id
                        ? (darkMode ? '#3a3a4e' : '#f5f5f5')
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
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{
                flex: 1,
                padding: '32px',
                overflowY: 'auto'
              }}>
                {settingsTab === 'account' && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Информация об аккаунте
                    </h3>

                    {user && (
                      <>
                        <div style={{
                          background: darkMode ? '#3a3a4e' : '#f5f5f5',
                          padding: '24px',
                          borderRadius: '16px',
                          marginBottom: '24px'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                          }}>
                            <div>
                              <div style={{
                                fontSize: '12px',
                                color: darkMode ? '#999' : '#666',
                                marginBottom: '4px',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                Имя
                              </div>
                              <div style={{
                                fontSize: '16px',
                                color: darkMode ? 'white' : '#333',
                                fontWeight: '600'
                              }}>
                                {user.display_name || 'Не указано'}
                              </div>
                            </div>

                            <div>
                              <div style={{
                                fontSize: '12px',
                                color: darkMode ? '#999' : '#666',
                                marginBottom: '4px',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                              }}>
                                NikMail
                              </div>
                              <div style={{
                                fontSize: '16px',
                                color: '#667eea',
                                fontWeight: '600'
                              }}>
                                {user.nikmail}
                              </div>
                            </div>

                            {user.email && (
                              <div>
                                <div style={{
                                  fontSize: '12px',
                                  color: darkMode ? '#999' : '#666',
                                  marginBottom: '4px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  Email
                                </div>
                                <div style={{
                                  fontSize: '16px',
                                  color: darkMode ? 'white' : '#333'
                                }}>
                                  {user.email}
                                </div>
                              </div>
                            )}

                            {user.phone && (
                              <div>
                                <div style={{
                                  fontSize: '12px',
                                  color: darkMode ? '#999' : '#666',
                                  marginBottom: '4px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  Телефон
                                </div>
                                <div style={{
                                  fontSize: '16px',
                                  color: darkMode ? 'white' : '#333'
                                }}>
                                  {user.phone}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Выйти из аккаунта
                        </button>
                      </>
                    )}
                  </div>
                )}

                {settingsTab === 'appearance' && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Внешний вид
                    </h3>

                    <div style={{
                      background: darkMode ? '#3a3a4e' : '#f5f5f5',
                      padding: '20px',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          color: darkMode ? 'white' : '#333'
                        }}>
                          Тёмная тема
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: darkMode ? '#999' : '#666'
                        }}>
                          {darkMode ? 'Включена' : 'Выключена'}
                        </div>
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '60px',
                        height: '34px'
                      }}>
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: darkMode ? '#667eea' : '#ccc',
                          transition: '0.4s',
                          borderRadius: '34px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '26px',
                            width: '26px',
                            left: darkMode ? '30px' : '4px',
                            bottom: '4px',
                            background: 'white',
                            transition: '0.4s',
                            borderRadius: '50%'
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {settingsTab === 'bookmarks' && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Закладки
                    </h3>

                    <div style={{
                      background: darkMode ? '#3a3a4e' : '#f5f5f5',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '24px'
                    }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '16px',
                        color: darkMode ? 'white' : '#333'
                      }}>
                        Добавить закладку
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Название"
                          value={newBookmark.name}
                          onChange={(e) => setNewBookmark({ ...newBookmark, name: e.target.value })}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            border: 'none',
                            borderRadius: '8px',
                            background: darkMode ? '#2d2d44' : 'white',
                            color: darkMode ? 'white' : '#333',
                            outline: 'none'
                          }}
                        />
                        <input
                          type="url"
                          placeholder="URL (https://...)"
                          value={newBookmark.url}
                          onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            border: 'none',
                            borderRadius: '8px',
                            background: darkMode ? '#2d2d44' : 'white',
                            color: darkMode ? 'white' : '#333',
                            outline: 'none'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Иконка (emoji)"
                          value={newBookmark.icon}
                          onChange={(e) => setNewBookmark({ ...newBookmark, icon: e.target.value })}
                          maxLength={2}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            border: 'none',
                            borderRadius: '8px',
                            background: darkMode ? '#2d2d44' : 'white',
                            color: darkMode ? 'white' : '#333',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={addBookmark}
                          style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Добавить закладку
                        </button>
                      </div>
                    </div>

                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Мои закладки ({bookmarks.length})
                    </h4>

                    {bookmarks.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: darkMode ? '#999' : '#666'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                        <p style={{ margin: 0, fontSize: '15px' }}>Закладок пока нет</p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {bookmarks.map((bookmark, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: darkMode ? '#3a3a4e' : '#f5f5f5',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <span style={{ fontSize: '24px' }}>{bookmark.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontWeight: '600',
                                  marginBottom: '4px',
                                  color: darkMode ? 'white' : '#333',
                                  fontSize: '15px'
                                }}>
                                  {bookmark.name}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: darkMode ? '#999' : '#666',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {bookmark.url}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeBookmark(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4444',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {settingsTab === 'history' && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      История поиска
                    </h3>

                    {!user ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: darkMode ? '#999' : '#666'
                      }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
                          Войдите, чтобы история сохранялась на сервере
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={clearHistory}
                          style={{
                            width: '100%',
                            padding: '14px',
                            background: darkMode ? '#3a3a4e' : '#f5f5f5',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ff4444',
                            cursor: 'pointer',
                            marginBottom: '16px'
                          }}
                        >
                          Очистить всю историю
                        </button>

                        <div style={{
                          fontSize: '14px',
                          color: darkMode ? '#999' : '#666',
                          marginBottom: '16px'
                        }}>
                          Всего записей: {searchHistory.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {settingsTab === 'advanced' && (
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Импорт и экспорт
                    </h3>

                    <div style={{
                      background: darkMode ? '#3a3a4e' : '#f5f5f5',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '32px' }}>📦</span>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: darkMode ? 'white' : '#333',
                            fontSize: '15px'
                          }}>
                            Резервное копирование
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: darkMode ? '#999' : '#666'
                          }}>
                            Сохраните закладки и настройки
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={exportSettings}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <span>📥</span> Экспорт настроек
                        </button>
                        
                        <label style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}>
                          <span>📤</span> Импорт настроек
                          <input
                            type="file"
                            accept=".json"
                            onChange={importSettings}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      О браузере
                    </h3>

                    <div style={{
                      background: darkMode ? '#3a3a4e' : '#f5f5f5',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        color: darkMode ? '#ccc' : '#666',
                        fontSize: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Версия:</span>
                          <strong style={{ color: darkMode ? 'white' : '#333' }}>2.0.0</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Закладок:</span>
                          <strong style={{ color: darkMode ? 'white' : '#333' }}>{bookmarks.length}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>История:</span>
                          <strong style={{ color: darkMode ? 'white' : '#333' }}>
                            {incognito ? 'Инкогнито' : user ? `${searchHistory.length} записей` : 'Войдите для просмотра'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Тема:</span>
                          <strong style={{ color: darkMode ? 'white' : '#333' }}>{darkMode ? 'Тёмная' : 'Светлая'}</strong>
                        </div>
                      </div>
                    </div>

                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      marginBottom: '24px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Опасная зона
                    </h3>

                    <div style={{
                      background: darkMode ? 'rgba(240, 0, 0, 0.1)' : '#FFF3F3',
                      border: '1px solid #FFCCCC',
                      padding: '20px',
                      borderRadius: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '32px' }}>⚠️</span>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: '#D32F2F',
                            fontSize: '15px'
                          }}>
                            Сброс всех настроек
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: darkMode ? '#999' : '#666'
                          }}>
                            Удалит все данные, закладки и выход из аккаунта
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={resetAllSettings}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Сбросить все настройки
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;