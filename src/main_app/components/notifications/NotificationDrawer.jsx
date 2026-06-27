import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Sparkles, Calendar, Bell, CheckCircle2, MoreVertical, Loader2 } from 'lucide-react';
import notificationService from '../../services/notificationService';

function NotificationDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      notificationService.fetchNotifications().then(data => {
        setNotifications(data);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await notificationService.markAllAsRead();
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read);

  const getIcon = (type) => {
    switch (type) {
      case 'streak': return <Flame size={18} className="text-orange-500" />;
      case 'cleo': return <Sparkles size={18} className="text-purple-500" />;
      case 'exam': return <Calendar size={18} className="text-blue-500" />;
      default: return <Bell size={18} className="text-accent-primary" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'streak': return 'bg-orange-500/10 border-orange-500/20';
      case 'cleo': return 'bg-purple-500/10 border-purple-500/20';
      case 'exam': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-accent-primary/10 border-accent-primary/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-primary shadow-2xl z-[101] flex flex-col border-l border-border-default overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 border-b border-border-default bg-bg-elevated">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-primary/10 text-accent-primary rounded-xl">
                    <Bell size={24} />
                  </div>
                  <h2 className="text-xl font-display font-bold text-text-primary">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-accent-primary text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-tertiary hover:bg-bg-subtle hover:text-text-primary rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs / Actions */}
              <div className="flex items-center justify-between">
                <div className="flex bg-bg-subtle p-1 rounded-lg">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === 'all' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${filter === 'unread' ? 'bg-bg-primary text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    Unread
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-accent-primary hover:text-accent-hover transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-40 text-text-tertiary"
                    >
                      <Loader2 size={32} className="animate-spin mb-3 text-accent-primary" />
                      <p className="text-sm font-medium">Loading notifications...</p>
                    </motion.div>
                  ) : filteredNotifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-40 text-text-tertiary"
                    >
                      <Bell size={40} className="mb-3 opacity-20" />
                      <p className="text-sm font-medium">No new notifications</p>
                    </motion.div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={notification.id}
                        className={`group relative flex gap-4 p-4 rounded-2xl border transition-all ${
                          notification.read 
                            ? 'bg-bg-primary border-transparent' 
                            : 'bg-bg-elevated border-accent-primary/20 shadow-sm'
                        }`}
                      >
                        {/* Unread dot */}
                        {!notification.read && (
                          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-primary" />
                        )}

                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getIconBg(notification.type)}`}>
                          {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 pr-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${notification.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                              {notification.title}
                            </h4>
                          </div>
                          <p className={`text-sm leading-relaxed mb-2 ${notification.read ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                            {notification.message}
                          </p>
                          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                            {notification.created_at ? new Date(notification.created_at).toLocaleString() : notification.time || 'Just now'}
                          </span>
                        </div>

                        {/* Actions menu (hover) */}
                        {!notification.read && (
                          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 bg-bg-subtle hover:bg-border-default rounded-md text-text-secondary transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationDrawer;
