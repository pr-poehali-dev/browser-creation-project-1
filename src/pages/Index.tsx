import React, { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'yandex' | 'github';
}

interface Bookmark {
  name: string;
  url: string;
  icon: string;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'account' | 'appearance' | 'history' | 'bookmarks'>('account');
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nikbrowser_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nikbrowser_darkmode');
    return saved === 'true';
  });
  const [incognito, setIncognito] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('nikbrowser_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nikbrowser_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newBookmark, setNewBookmark] = useState({ name: '', url: '', icon: '⭐' });

  useEffect(() => {
    localStorage.setItem('nikbrowser_darkmode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (!incognito) {
      localStorage.setItem('nikbrowser_history', JSON.stringify(searchHistory));
    }
  }, [searchHistory, incognito]);

  useEffect(() => {
    localStorage.setItem('nikbrowser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (!incognito && !searchHistory.includes(searchQuery.trim())) {
        setSearchHistory(prev => [searchQuery.trim(), ...prev].slice(0, 20));
      }
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const handleLogin = (provider: 'google' | 'yandex' | 'github') => {
    const mockUsers = {
      google: { name: 'Пользователь Google', email: 'user@gmail.com', avatar: '👤', provider: 'google' as const },
      yandex: { name: 'Пользователь Яндекс', email: 'user@yandex.ru', avatar: '👤', provider: 'yandex' as const },
      github: { name: 'GitHub User', email: 'user@github.com', avatar: '👤', provider: 'github' as const }
    };
    const userData = mockUsers[provider];
    setUser(userData);
    localStorage.setItem('nikbrowser_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nikbrowser_user');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('nikbrowser_history');
  };

  const removeHistoryItem = (item: string) => {
    setSearchHistory(prev => prev.filter(h => h !== item));
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

  const quickLinks = [
    { name: 'Google', url: 'https://google.com', color: '#4285F4', icon: '🔍' },
    { name: 'YouTube', url: 'https://youtube.com', color: '#FF0000', icon: '▶️' },
    { name: 'GitHub', url: 'https://github.com', color: '#24292e', icon: '💻' },
    { name: 'ВКонтакте', url: 'https://vk.com', color: '#0077FF', icon: '💙' },
    { name: 'Telegram', url: 'https://web.telegram.org', color: '#0088cc', icon: '✉️' },
    { name: 'Почта', url: 'https://mail.google.com', color: '#EA4335', icon: '📧' }
  ];

  const bgGradient = darkMode 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const textColor = darkMode ? 'white' : 'white';
  const cardBg = darkMode ? '#2a2a3e' : 'white';
  const cardTextColor = darkMode ? 'white' : '#333';

  return (
    <div style={{
      minHeight: '100vh',
      background: incognito ? 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)' : bgGradient,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      transition: 'background 0.3s ease'
    }}>
      {incognito && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000
        }}>
          🕵️ Режим инкогнито активен
        </div>
      )}

      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          fontSize: '24px',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
        }}
      >
        ⚙️
      </button>

      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1001,
              animation: 'fadeIn 0.3s ease'
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: darkMode ? '#2a2a3e' : 'white',
            borderRadius: '24px',
            padding: '0',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 1002,
            maxWidth: '580px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            animation: 'slideIn 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              borderBottom: `1px solid ${darkMode ? '#3a3a4e' : '#e0e0e0'}`
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: darkMode ? 'white' : '#333'
              }}>
                Настройки браузера
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                  color: darkMode ? 'white' : '#333'
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${darkMode ? '#3a3a4e' : '#e0e0e0'}`,
              padding: '0 32px'
            }}>
              {[
                { id: 'account', label: 'Аккаунт', icon: '👤' },
                { id: 'appearance', label: 'Внешний вид', icon: '🎨' },
                { id: 'bookmarks', label: 'Закладки', icon: '⭐' },
                { id: 'history', label: 'История', icon: '📚' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: settingsTab === tab.id 
                      ? '#F00000' 
                      : darkMode ? '#999' : '#666',
                    borderBottom: settingsTab === tab.id ? '2px solid #F00000' : '2px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{
              padding: '32px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {settingsTab === 'account' && (
                <div>
                  {user ? (
                    <div>
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                          {user.avatar}
                        </div>
                        <h3 style={{
                          color: 'white',
                          margin: '0 0 8px 0',
                          fontSize: '20px',
                          fontWeight: '600'
                        }}>
                          {user.name}
                        </h3>
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          margin: 0,
                          fontSize: '14px'
                        }}>
                          {user.email}
                        </p>
                        <div style={{
                          marginTop: '12px',
                          display: 'inline-block',
                          padding: '6px 16px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {user.provider === 'google' ? 'Google' : user.provider === 'yandex' ? 'Яндекс ID' : 'GitHub'}
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '16px',
                          background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Выйти из аккаунта
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        background: '#FFF3CD',
                        border: '1px solid #FFE69C',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px'
                      }}>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#856404',
                          textAlign: 'center',
                          fontWeight: '500'
                        }}>
                          ⚠️ По техническим причинам вход в аккаунты не работает
                        </p>
                      </div>
                      <p style={{
                        color: darkMode ? '#ccc' : '#666',
                        marginBottom: '24px',
                        fontSize: '15px'
                      }}>
                        Войдите в аккаунт, чтобы синхронизировать закладки, историю и настройки между устройствами
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { provider: 'google', label: 'Войти через Google', icon: '🔵' },
                          { provider: 'yandex', label: 'Войти через Яндекс ID', icon: '🔴' },
                          { provider: 'github', label: 'Войти через GitHub', icon: '⚫' }
                        ].map(({ provider, label, icon }) => (
                          <button
                            key={provider}
                            onClick={() => handleLogin(provider as any)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '16px 20px',
                              background: darkMode ? '#3a3a4e' : 'white',
                              border: `2px solid ${darkMode ? '#4a4a5e' : '#e0e0e0'}`,
                              borderRadius: '12px',
                              fontSize: '16px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              color: darkMode ? 'white' : '#333'
                            }}
                          >
                            <div style={{ fontSize: '24px' }}>{icon}</div>
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Тема оформления
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '16px',
                      background: darkMode ? '#3a3a4e' : '#f5f5f5',
                      borderRadius: '12px',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{darkMode ? '🌙' : '☀️'}</span>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: darkMode ? 'white' : '#333'
                          }}>
                            {darkMode ? 'Тёмная тема' : 'Светлая тема'}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: darkMode ? '#999' : '#666'
                          }}>
                            {darkMode ? 'Приятно для глаз ночью' : 'Классическая тема'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                          background: darkMode ? '#667eea' : '#e0e0e0',
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.3s'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: darkMode ? '26px' : '2px',
                          transition: 'left 0.3s'
                        }} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      color: darkMode ? 'white' : '#333'
                    }}>
                      Режим приватности
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '16px',
                      background: incognito ? 'rgba(0, 0, 0, 0.3)' : (darkMode ? '#3a3a4e' : '#f5f5f5'),
                      borderRadius: '12px',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: incognito ? '2px solid #666' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>🕵️</span>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            marginBottom: '4px',
                            color: darkMode ? 'white' : '#333'
                          }}>
                            Режим инкогнито
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: darkMode ? '#999' : '#666'
                          }}>
                            История не сохраняется
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIncognito(!incognito)}
                        style={{
                          background: incognito ? '#666' : '#e0e0e0',
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.3s'
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '2px',
                          left: incognito ? '26px' : '2px',
                          transition: 'left 0.3s'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'bookmarks' && (
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: darkMode ? 'white' : '#333'
                  }}>
                    Добавить закладку
                  </h3>
                  <div style={{
                    background: darkMode ? '#3a3a4e' : '#f5f5f5',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '24px'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: darkMode ? 'white' : '#333'
                      }}>
                        Название
                      </label>
                      <input
                        type="text"
                        value={newBookmark.name}
                        onChange={(e) => setNewBookmark({ ...newBookmark, name: e.target.value })}
                        placeholder="Мой сайт"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${darkMode ? '#4a4a5e' : '#ddd'}`,
                          background: darkMode ? '#2a2a3e' : 'white',
                          color: darkMode ? 'white' : '#333',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: darkMode ? 'white' : '#333'
                      }}>
                        URL адрес
                      </label>
                      <input
                        type="url"
                        value={newBookmark.url}
                        onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                        placeholder="https://example.com"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${darkMode ? '#4a4a5e' : '#ddd'}`,
                          background: darkMode ? '#2a2a3e' : 'white',
                          color: darkMode ? 'white' : '#333',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: darkMode ? 'white' : '#333'
                      }}>
                        Иконка (эмодзи)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['⭐', '🔥', '💼', '🎮', '🎵', '📱', '💻', '🎨', '📚', '⚡'].map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setNewBookmark({ ...newBookmark, icon: emoji })}
                            style={{
                              fontSize: '24px',
                              padding: '8px',
                              border: newBookmark.icon === emoji ? '2px solid #F00000' : `1px solid ${darkMode ? '#4a4a5e' : '#ddd'}`,
                              borderRadius: '8px',
                              background: darkMode ? '#2a2a3e' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={addBookmark}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Добавить закладку
                    </button>
                  </div>

                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: darkMode ? 'white' : '#333'
                  }}>
                    Мои закладки ({bookmarks.length})
                  </h3>

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
                                fontSize: '14px'
                              }}>
                                {bookmark.name}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: darkMode ? '#999' : '#666',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {bookmark.url}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'none'
                              }}
                            >
                              Открыть
                            </a>
                            <button
                              onClick={() => removeBookmark(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#F00000',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '4px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'history' && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: 0,
                      color: darkMode ? 'white' : '#333'
                    }}>
                      История поиска
                    </h3>
                    {searchHistory.length > 0 && (
                      <button
                        onClick={clearHistory}
                        style={{
                          background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Очистить всё
                      </button>
                    )}
                  </div>

                  {incognito ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: darkMode ? '#999' : '#666'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕵️</div>
                      <p style={{ margin: 0, fontSize: '15px' }}>
                        Режим инкогнито активен.<br />История не сохраняется.
                      </p>
                    </div>
                  ) : searchHistory.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: darkMode ? '#999' : '#666'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                      <p style={{ margin: 0, fontSize: '15px' }}>История поиска пуста</p>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {searchHistory.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: darkMode ? '#3a3a4e' : '#f5f5f5',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: darkMode ? 'white' : '#333'
                          }}
                        >
                          <span style={{ flex: 1 }}>🔍 {item}</span>
                          <button
                            onClick={() => removeHistoryItem(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#F00000',
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
            </div>
          </div>
        </>
      )}

      <div style={{
        width: '100%',
        maxWidth: '680px',
        textAlign: 'center'
      }}>
        <div style={{
          marginBottom: '48px',
          animation: 'fadeIn 0.6s ease-in'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: incognito 
                ? 'linear-gradient(135deg, #666 0%, #333 100%)'
                : 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 24px rgba(240, 0, 0, 0.3)'
            }}>
              {incognito ? '🕵️' : '🌐'}
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: textColor,
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Nikbrowser
            </h1>
          </div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '18px',
            margin: 0
          }}>
            {incognito ? 'Режим инкогнито - история не сохраняется' : 'Быстрый и удобный поиск в интернете'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
          <div style={{
            position: 'relative',
            width: '100%'
          }}>
            <div style={{
              background: cardBg,
              borderRadius: '28px',
              boxShadow: isFocused 
                ? '0 12px 48px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(240, 0, 0, 0.2)' 
                : '0 8px 32px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px'
              }}>
                <div style={{
                  fontSize: '24px',
                  padding: '0 12px',
                  opacity: 0.6
                }}>
                  🔍
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Что будем искать?"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '16px 8px',
                    fontSize: '18px',
                    fontFamily: 'inherit',
                    background: 'transparent',
                    color: cardTextColor
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '22px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    margin: '4px'
                  }}
                >
                  Найти
                </button>
              </div>
            </div>
          </div>
        </form>

        <div>
          <h3 style={{
            color: textColor,
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px',
            opacity: 0.95
          }}>
            Популярные сервисы
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {quickLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: cardBg,
                  padding: '20px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: cardTextColor,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  fontSize: '32px',
                  marginBottom: '4px'
                }}>
                  {link.icon}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: link.color
                }}>
                  {link.name}
                </span>
              </a>
            ))}
          </div>
        </div>

        {user && (
          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            color: 'white',
            fontSize: '14px'
          }}>
            Вы вошли как <strong>{user.name}</strong>
          </div>
        )}

        <div style={{
          marginTop: '48px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px'
        }}>
          Поиск работает через Google
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -45%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Index;