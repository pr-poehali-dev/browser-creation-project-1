import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Download {
  id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: string;
  progress: number;
  created_at: string;
  completed_at: string;
}

export default function DownloadsPage() {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    loadDownloads();
  }, [userId, navigate]);

  const loadDownloads = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/54d87de2-f3c7-4bbf-9d6b-236713ff4403', {
        method: 'GET',
        headers: {
          'X-User-Id': userId.toString()
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setDownloads(data.downloads.filter((d: Download) => d.status !== 'deleted'));
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Неизвестно';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} МБ`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} КБ`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType?.includes('pdf')) return 'FileText';
    if (fileType?.includes('image')) return 'Image';
    if (fileType?.includes('video')) return 'Video';
    if (fileType?.includes('audio')) return 'Music';
    if (fileType?.includes('zip') || fileType?.includes('rar')) return 'Archive';
    if (fileType?.includes('word') || fileType?.includes('document')) return 'FileText';
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return 'Table';
    return 'File';
  };

  const handleOpen = (download: Download) => {
    window.open(download.file_url, '_blank');
  };

  const handleDelete = async (downloadId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/54d87de2-f3c7-4bbf-9d6b-236713ff4403?id=${downloadId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId.toString()
        }
      });
      
      if (response.ok) {
        setDownloads(downloads.filter(d => d.id !== downloadId));
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Удалить все загрузки?')) return;
    
    for (const download of downloads) {
      await handleDelete(download.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Загрузки</h1>
              <p className="text-sm text-gray-600 mt-1">
                {downloads.length === 0 ? 'Нет загрузок' : `${downloads.length} ${downloads.length === 1 ? 'файл' : 'файлов'}`}
              </p>
            </div>
          </div>
          
          {downloads.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Очистить всё
            </button>
          )}
        </div>

        {downloads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Icon name="Download" size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Нет загрузок</h2>
            <p className="text-gray-600">
              Все файлы, которые вы скачаете, будут отображаться здесь
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon name={getFileIcon(download.file_type)} size={20} className="text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {download.file_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-600">
                      {formatFileSize(download.file_size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600">
                      {formatDate(download.completed_at || download.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpen(download)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Открыть файл"
                  >
                    <Icon name="ExternalLink" size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(download.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
