import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Download {
  id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  download_status: string;
  progress: number;
  download_speed?: string;
  time_remaining?: string;
  created_at: string;
  completed_at?: string;
  is_installed: boolean;
  installed_at?: string;
}

export default function Downloads() {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/54d87de2-f3c7-4bbf-9d6b-236713ff4403', {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const handleInstall = async (download: Download) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const response = await fetch('https://functions.poehali.dev/54d87de2-f3c7-4bbf-9d6b-236713ff4403', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          id: download.id,
          is_installed: !download.is_installed
        })
      });

      if (response.ok) {
        loadDownloads();
      }
    } catch (error) {
      console.error('Ошибка установки:', error);
    }
  };

  const handleDelete = async (downloadId: number) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!confirm('Удалить эту загрузку?')) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/54d87de2-f3c7-4bbf-9d6b-236713ff4403?id=${downloadId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id.toString()
        }
      });

      if (response.ok) {
        loadDownloads();
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleOpenFile = (url: string) => {
    window.open(url, '_blank');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return 'FileText';
    if (fileType?.includes('image')) return 'Image';
    if (fileType?.includes('video')) return 'Video';
    if (fileType?.includes('audio')) return 'Music';
    if (fileType?.includes('zip') || fileType?.includes('rar')) return 'Archive';
    if (fileType?.includes('word') || fileType?.includes('document')) return 'FileText';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return 'Sheet';
    return 'File';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Загрузки</h1>
            <p className="text-muted-foreground mt-1">
              {downloads.length === 0 ? 'Нет загрузок' : `Всего: ${downloads.length}`}
            </p>
          </div>
        </div>

        {downloads.length === 0 ? (
          <div className="text-center py-16">
            <Icon name="Download" size={64} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Загрузок пока нет</h2>
            <p className="text-muted-foreground">
              Скачанные файлы появятся здесь
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={getFileIcon(download.file_type)} size={20} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{download.file_name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{formatFileSize(download.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(download.created_at)}</span>
                      {download.is_installed && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-600">
                            <Icon name="Check" size={14} />
                            Установлено
                          </span>
                        </>
                      )}
                    </div>

                    {download.download_status === 'downloading' && (
                      <div className="mt-3">
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{download.progress}%</span>
                          <span>{download.download_speed}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenFile(download.file_url)}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      title="Открыть файл"
                    >
                      <Icon name="FolderOpen" size={18} className="text-primary" />
                    </button>

                    {download.file_type?.includes('exe') || download.file_type?.includes('msi') ? (
                      <button
                        onClick={() => handleInstall(download)}
                        className={`p-2 rounded-lg transition-colors ${
                          download.is_installed 
                            ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                            : 'hover:bg-accent'
                        }`}
                        title={download.is_installed ? 'Установлено' : 'Установить'}
                      >
                        <Icon name={download.is_installed ? 'Check' : 'Download'} size={18} />
                      </button>
                    ) : null}

                    <button
                      onClick={() => handleDelete(download.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                      title="Удалить"
                    >
                      <Icon name="Trash2" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
