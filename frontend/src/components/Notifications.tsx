import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'offer' | 'review' | 'message';
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: 1, 
      title: t('newBookingRequest'), 
      message: t('youHaveNewBookingRequest'), 
      time: '2 hours ago', 
      read: false,
      type: 'booking'
    },
    { 
      id: 2, 
      title: t('specialOffer'), 
      message: t('exclusiveOfferForWeddingDresses'), 
      time: '1 day ago', 
      read: false,
      type: 'offer'
    },
    { 
      id: 3, 
      title: t('newReview'), 
      message: t('clientLeftReviewForYourService'), 
      time: '2 days ago', 
      read: true,
      type: 'review'
    },
    { 
      id: 4, 
      title: t('newMessage'), 
      message: t('youHaveNewMessageFromClient'), 
      time: '3 days ago', 
      read: true,
      type: 'message'
    },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, read: true })
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="glass p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('notifications')}</h2>
          <button 
            onClick={markAllAsRead}
            className="text-primary-600 hover:text-white/70 text-sm"
            disabled={unreadCount === 0}
          >
            {t('markAllAsRead')}
          </button>
        </div>
        
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`border-l-4 p-4 rounded-r-lg ${
                notification.read 
                  ? 'border-white/30 bg-white/5' 
                  : 'border-primary-500 bg-white/10'
              }`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-white">{notification.title}</h3>
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="text-sm text-primary-600 hover:text-white/70"
                  >
                    {t('markAsRead')}
                  </button>
                )}
              </div>
              <p className="text-white/80 mt-1">{notification.message}</p>
              <p className="text-xs text-white/60 mt-2">{notification.time}</p>
            </div>
          ))}
          
          {notifications.length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">{t('noNotifications')}</h3>
              <p className="mt-1 text-sm text-white/60">{t('youHaveNoNewNotifications')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
