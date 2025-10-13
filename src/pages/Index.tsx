import React, { useState } from 'react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '20px auto',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <div style={{
        border: '2px solid #F00000',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h1>Поиск в Nikbrowser</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите ваш запрос..."
            required
            style={{
              width: '100%',
              padding: '10px',
              margin: '8px 0',
              boxSizing: 'border-box' as const
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#F00000',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Поиск...
          </button>
        </form>
      </div>
    </div>
  );
};

export default Index;
