import { useEffect } from 'react';

// Definir el tipo Notification localmente para evitar problemas de importación
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

interface NotificationToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

export function NotificationToast({ notification, onRemove }: NotificationToastProps) {
  useEffect(() => {
    // Auto-remove notification after 5 seconds
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '🏆';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`${getBgColor()} text-white rounded-2xl shadow-2xl p-4 mb-3 transform transition-all duration-500 ease-in-out animate-fade-in`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getIcon()}</div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{notification.message}</p>
            <p className="text-xs opacity-80">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="text-white hover:text-gray-200 transition-colors duration-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full space-y-2">
              {notifications.map((notification, index) => (
          <NotificationToast
            key={`${notification.id}-${notification.timestamp.getTime()}-${index}`}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
    </div>
  );
}
