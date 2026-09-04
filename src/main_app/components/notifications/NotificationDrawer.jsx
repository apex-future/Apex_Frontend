import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Fire, Sparkle, Calendar, Bell, CheckCircle, Spinner, Megaphone, ArrowSquareOut } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import Button from '../ui/Button';
import Label from '../ui/Label';

function NotificationDrawer({ isOpen, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const navigate = useNavigate();

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

  const handleCtaClick = (route) => {
    if (route) {
      navigate(route);
      onClose();
    }
  };

  // Split into broadcasts and personal
  const broadcasts = notifications.filter(n => n.source === 'broadcast');
  const personal = notifications.filter(n => n.source !== 'broadcast');

  const filteredBroadcasts = broadcasts.filter(n => filter === 'all' || !n.read);
  const filteredPersonal = personal.filter(n => filter === 'all' || !n.read);

  const formatNotificationDate = (dateInput) => {
    if (!dateInput) return 'Today';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return dateInput;

    const now = new Date();
    const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffDays = Math.round((nowMidnight.getTime() - targetMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];

    if (date.getFullYear() === now.getFullYear()) {
      return `${day} ${month}`;
    } else {
      return `${day} ${month} ${date.getFullYear()}`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'streak': case 'streak_milestone': return <Fire size={18} weight="fill" className="text-orange-500" />;
      case 'cleo': return <Sparkle size={18} weight="fill" className="text-purple-500" />;
      case 'exam': case 'exam_countdown': return <Calendar size={18} weight="fill" className="text-blue-500" />;
      case 'daily_quest_ready': return <Sparkle size={18} weight="fill" className="text-emerald-500" />;
      case 'study_wrap': return <Fire size={18} weight="fill" className="text-amber-500" />;
      default: return <Bell size={18} weight="fill" className="text-accent-primary" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'streak': case 'streak_milestone': return 'bg-orange-500/10 border-orange-500/20';
      case 'cleo': return 'bg-purple-500/10 border-purple-500/20';
      case 'exam': case 'exam_countdown': return 'bg-blue-500/10 border-blue-500/20';
      case 'daily_quest_ready': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'study_wrap': return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-accent-primary/10 border-accent-primary/20';
    }
  };

  const hasContent = filteredBroadcasts.length > 0 || filteredPersonal.length > 0;

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
            <div className="flex flex-col gap-4 p-5 sm:p-6 border-b border-black/10 dark:border-white/10 bg-bg-primary">
              {/* Top Row: Glassmorphic Pill Header */}
              <div className="flex items-center justify-between relative w-full min-h-[44px]">
                {/* Left placeholder spacer to keep center title balanced */}
                <div className="w-10 h-10 opacity-0 pointer-events-none shrink-0" />

                {/* Center Glassmorphic Title Pill */}
                <div className="px-5 py-2 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold font-display text-text-primary">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-accent-primary text-white text-[10px] font-bold rounded-full min-w-[18px] text-center leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Right Close Glassmorphic Pill */}
                <div className="px-1 py-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] shrink-0">
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary rounded-full transition-all flex items-center justify-center"
                    aria-label="Close notifications"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Tabs / Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex p-1 rounded-full bg-white/15 dark:bg-white/5 backdrop-blur-xl border border-white/25 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${filter === 'all' ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/25' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${filter === 'unread' ? 'bg-purple-600 text-white shadow-xs shadow-purple-500/25' : 'text-text-tertiary hover:text-text-secondary'}`}
                  >
                    Unread
                  </button>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle size={14} weight="fill" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col">
                <AnimatePresence>
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-40 text-text-tertiary p-6"
                    >
                      <Spinner size={32} className="animate-spin mb-3 text-purple-600" />
                      <p className="text-sm font-medium">Loading notifications...</p>
                    </motion.div>
                  ) : !hasContent ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-40 text-text-tertiary p-6"
                    >
                      <Bell size={40} weight="fill" className="mb-3 opacity-20" />
                      <p className="text-sm font-medium">No new notifications</p>
                    </motion.div>
                  ) : (
                    <>
                      {/* ─── What's New (Broadcasts) ─── */}
                      {filteredBroadcasts.length > 0 && (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 px-6 pt-3 pb-2">
                            <Megaphone size={14} weight="fill" className="text-purple-500" />
                            <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">What's New</span>
                          </div>
                          {filteredBroadcasts.map((broadcast, index) => (
                            <React.Fragment key={`broadcast-${broadcast.id}`}>
                              {index > 0 && (
                                <div className="h-px bg-black/10 dark:bg-white/10 w-full" />
                              )}
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group relative flex gap-4 px-6 py-4 w-full transition-all ${
                                  broadcast.read
                                    ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                    : 'bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200/60 dark:hover:bg-purple-900/60'
                                }`}
                              >
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
                                  <Megaphone size={18} weight="fill" className="text-white" />
                                </div>

                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h4 className={`text-[15px] sm:text-base font-bold leading-snug truncate ${broadcast.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                                      {broadcast.title}
                                    </h4>
                                    <span className="text-xs font-medium text-text-tertiary shrink-0 whitespace-nowrap">
                                      {formatNotificationDate(broadcast.created_at)}
                                    </span>
                                  </div>

                                  {broadcast.version && (
                                    <div className="mb-2">
                                      <Label color="purple" size="sm" className="!px-2.5 !py-0.5 !text-[10px] font-bold">
                                        Version: {broadcast.version.replace(/^version:\s*/i, '')}
                                      </Label>
                                    </div>
                                  )}

                                  <p className={`text-sm leading-relaxed mb-1 ${broadcast.read ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                                    {broadcast.body}
                                  </p>

                                  {broadcast.cta_label && broadcast.cta_route && (
                                    <div className="mt-3.5 mb-1">
                                      <Button
                                        variant="primary"
                                        fullWidth={false}
                                        onClick={() => handleCtaClick(broadcast.cta_route)}
                                        className="!py-1.5 !px-4 !text-xs !rounded-xl"
                                      >
                                        <span>{broadcast.cta_label}</span>
                                        <ArrowSquareOut size={14} weight="bold" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* ─── Personal Notifications ─── */}
                      {filteredPersonal.length > 0 && (
                        <div className="flex flex-col">
                          {filteredBroadcasts.length > 0 && (
                            <div className="h-px bg-black/10 dark:bg-white/10 w-full" />
                          )}
                          <div className="flex items-center gap-2 px-6 pt-3 pb-2">
                            <Bell size={14} weight="fill" className="text-text-tertiary" />
                            <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Activity</span>
                          </div>
                          {filteredPersonal.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                              {index > 0 && (
                                <div className="h-px bg-black/10 dark:bg-white/10 w-full" />
                              )}
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group relative flex gap-4 px-6 py-4 w-full transition-all ${
                                  notification.read 
                                    ? 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5' 
                                    : 'bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200/60 dark:hover:bg-purple-900/60'
                                }`}
                              >
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getIconBg(notification.type)}`}>
                                  {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-baseline justify-between gap-2 mb-1">
                                    <h4 className={`text-[15px] sm:text-base font-bold leading-snug truncate ${notification.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs font-medium text-text-tertiary shrink-0 whitespace-nowrap">
                                      {formatNotificationDate(notification.created_at || notification.time)}
                                    </span>
                                  </div>
                                  <p className={`text-sm leading-relaxed mb-1 ${notification.read ? 'text-text-tertiary' : 'text-text-secondary'}`}>
                                    {notification.body || notification.message}
                                  </p>
                                </div>

                                {/* Actions menu (hover) */}
                                {!notification.read && (
                                  <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="p-1.5 bg-bg-subtle hover:bg-border-default rounded-md text-text-secondary transition-colors"
                                      title="Mark as read"
                                    >
                                      <CheckCircle size={16} weight="fill" />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </>
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
