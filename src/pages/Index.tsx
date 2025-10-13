import React, { useState } from 'react';

interface User {
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'yandex' | 'github';
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const handleLogin = (provider: 'google' | 'yandex' | 'github') => {
    const mockUsers = {
      google: { name: 'Пользователь Google', email: 'user@gmail.com', avatar: '👤', provider: 'google' as const },
      yandex: { name: 'Пользователь Яндекс', email: 'user@yandex.ru', avatar: '👤', provider: 'yandex' as const },
      github: { name: 'GitHub User', email: 'user@github.com', avatar: '👤', provider: 'github' as const }
    };
    setUser(mockUsers[provider]);
    setShowSettings(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const quickLinks = [
    { name: 'Google', url: 'https://google.com', color: '#4285F4', icon: '🔍' },
    { name: 'YouTube', url: 'https://youtube.com', color: '#FF0000', icon: '▶️' },
    { name: 'GitHub', url: 'https://github.com', color: '#24292e', icon: '💻' },
    { name: 'ВКонтакте', url: 'https://vk.com', color: '#0077FF', icon: '💙' },
    { name: 'Telegram', url: 'https://web.telegram.org', color: '#0088cc', icon: '✉️' },
    { name: 'Почта', url: 'https://mail.google.com', color: '#EA4335', icon: '📧' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
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
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 1002,
            maxWidth: '480px',
            width: '90%',
            animation: 'slideIn 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#333'
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
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.6'; }}
              >
                ✕
              </button>
            </div>

            {user ? (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(240, 0, 0, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Выйти из аккаунта
                </button>
              </div>
            ) : (
              <div>
                <p style={{
                  color: '#666',
                  marginBottom: '24px',
                  fontSize: '15px'
                }}>
                  Войдите в аккаунт, чтобы синхронизировать закладки, историю и настройки между устройствами
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleLogin('google')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      background: 'white',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: '#333'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#4285F4';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(66, 133, 244, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      🔵
                    </div>
                    <span>Войти через Google</span>
                  </button>

                  <button
                    onClick={() => handleLogin('yandex')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      background: 'white',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: '#333'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#FC3F1D';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(252, 63, 29, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      🔴
                    </div>
                    <span>Войти через Яндекс ID</span>
                  </button>

                  <button
                    onClick={() => handleLogin('github')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      background: 'white',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: '#333'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#24292e';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(36, 41, 46, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      ⚫
                    </div>
                    <span>Войти через GitHub</span>
                  </button>
                </div>

                <p style={{
                  marginTop: '20px',
                  fontSize: '12px',
                  color: '#999',
                  textAlign: 'center'
                }}>
                  Нажимая "Войти", вы соглашаетесь с условиями использования
                </p>
              </div>
            )}
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
              background: 'linear-gradient(135deg, #F00000 0%, #FF4444 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 24px rgba(240, 0, 0, 0.3)'
            }}>
              🌐
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '700',
              color: 'white',
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
            Быстрый и удобный поиск в интернете
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
          <div style={{
            position: 'relative',
            width: '100%'
          }}>
            <div style={{
              background: 'white',
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
                    background: 'transparent'
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
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(240, 0, 0, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
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
            color: 'white',
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
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '20px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
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
