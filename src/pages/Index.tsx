import React, { useState } from 'react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  const quickLinks = [
    { name: 'Google', url: 'https://google.com', color: '#4285F4', icon: '🔍' },
    { name: 'YouTube', url: 'https://youtube.com', color: '#FF0000', icon: '▶️' },
    { name: 'GitHub', url: 'https://github.com', color: '#24292e', icon: '💻' },
    { name: 'ВКонтакте', url: 'https://vk.com', color: '#0077FF', icon: '💙' },
    { name: 'Telegram', url: 'https://web.telegram.org', color: '#0088cc', icon: '✈️' },
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
      padding: '20px'
    }}>
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
        `}
      </style>
    </div>
  );
};

export default Index;
