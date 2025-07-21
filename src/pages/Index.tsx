import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

const Index = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Новая вкладка', url: 'https://google.com', favicon: '🌐' }
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [currentUrl, setCurrentUrl] = useState('https://google.com');
  const [history, setHistory] = useState<string[]>(['https://google.com']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'Новая вкладка',
      url: 'https://google.com',
      favicon: '🌐'
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
    }
  };

  const navigateForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
    }
  };

  const refreshPage = () => {
    // Эмуляция обновления страницы
    console.log('Refreshing page...');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newHistory = [...history.slice(0, historyIndex + 1), currentUrl];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const shortcuts = [
    { name: 'Google', url: 'https://google.com', icon: '🔍' },
    { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
    { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
    { name: 'Gmail', url: 'https://gmail.com', icon: '📧' },
    { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
    { name: 'Reddit', url: 'https://reddit.com', icon: '📱' }
  ];

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col">
      {/* Панель вкладок */}
      <div className="bg-[#1E293B] text-white px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#F8FAFC] text-black'
                  : 'bg-[#334155] hover:bg-[#475569]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-sm">{tab.favicon}</span>
              <span className="text-sm font-medium max-w-[120px] truncate">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 rounded p-0.5"
                >
                  <Icon name="X" size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1.5 hover:bg-[#334155] rounded transition-colors"
          >
            <Icon name="Plus" size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-[#334155] rounded transition-colors">
            <Icon name="Settings" size={16} />
          </button>
          <button className="p-1.5 hover:bg-[#334155] rounded transition-colors">
            <Icon name="User" size={16} />
          </button>
        </div>
      </div>

      {/* Панель навигации */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={navigateBack}
            disabled={historyIndex === 0}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button
            onClick={navigateForward}
            disabled={historyIndex === history.length - 1}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
          <button
            onClick={refreshPage}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Icon name="RotateCcw" size={16} />
          </button>
        </div>

        <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <Icon name="Lock" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
            <Input
              type="text"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              className="pl-10 pr-10 py-2 text-sm bg-[#F1F5F9] border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Поиск в Google или введите URL"
            />
            <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Icon name="Search" size={16} className="text-gray-400" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Icon name="Bookmark" size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Icon name="Download" size={16} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Icon name="MoreVertical" size={16} />
          </button>
        </div>
      </div>

      {/* Основная область браузера */}
      <div className="flex-1 bg-white">
        {currentUrl === 'https://google.com' ? (
          <div className="h-full flex flex-col items-center justify-center bg-white">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-light text-[#1E293B] mb-8">Google</h1>
              <div className="w-96 mb-6">
                <Input
                  type="text"
                  placeholder="Поиск в Google..."
                  className="w-full py-3 px-4 text-lg border-2 border-gray-200 rounded-full focus:border-[#2563EB] focus:ring-0"
                />
              </div>
              <div className="flex gap-3 justify-center mb-8">
                <Button variant="outline" className="px-6 py-2 rounded-lg">
                  Поиск в Google
                </Button>
                <Button variant="outline" className="px-6 py-2 rounded-lg">
                  Мне повезёт!
                </Button>
              </div>
            </div>
            
            <div className="w-full max-w-4xl px-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Быстрый доступ</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.name}
                    onClick={() => setCurrentUrl(shortcut.url)}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-gray-200 transition-colors">
                      {shortcut.icon}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{shortcut.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <Card className="p-8 text-center max-w-md">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Страница загружается</h2>
              <p className="text-gray-600 mb-4">{currentUrl}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#2563EB] h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Статусная строка */}
      <div className="bg-[#F1F5F9] border-t border-gray-200 px-4 py-1 text-xs text-gray-600 flex items-center justify-between">
        <span>Готов</span>
        <div className="flex items-center gap-4">
          <span>Защищённое соединение</span>
          <span>JavaScript включён</span>
          <span>Zoom: 100%</span>
        </div>
      </div>
    </div>
  );
};

export default Index;