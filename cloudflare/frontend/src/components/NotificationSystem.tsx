import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Notification {
  id: string;
  type: 'reminder' | 'milestone' | 'prompt' | 'streak' | 'family';
  title: string;
  message: string;
  emotionalAppeal: string;
  icon: string;
  action?: {
    label: string;
    route: string;
  };
  scheduledFor?: Date;
  read: boolean;
  createdAt: Date;
}

interface NotificationSettings {
  dailyReminders: boolean;
  weeklyDigest: boolean;
  streakAlerts: boolean;
  familyActivity: boolean;
  milestoneAlerts: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  preferredTime: string; // "09:00"
}

// Emotional appeal messages for different contexts
const EMOTIONAL_PROMPTS = {
  voiceStory: [
    {
      title: "Your voice is irreplaceable",
      message: "Record a 2-minute story today",
      emotionalAppeal: "Someday, your grandchildren will play this recording and feel like you're right there with them. Your voice is a gift only you can give.",
      icon: "🎙️"
    },
    {
      title: "They want to hear YOU",
      message: "Share a memory in your own words",
      emotionalAppeal: "Photos fade, but your voice carries your soul. What story have you been meaning to tell?",
      icon: "💫"
    },
    {
      title: "Before the moment passes",
      message: "Capture today's thoughts",
      emotionalAppeal: "The way you laugh, the words you choose, the pauses you take — these are the things they'll treasure most.",
      icon: "✨"
    }
  ],
  memory: [
    {
      title: "A photo needs its story",
      message: "Add context to a recent memory",
      emotionalAppeal: "That photo on your phone? In 50 years, no one will know who's in it or why it mattered. You're the only one who can tell that story.",
      icon: "📸"
    },
    {
      title: "Don't let this moment fade",
      message: "Preserve today's memory",
      emotionalAppeal: "The small moments become the big ones. What happened today that you never want to forget?",
      icon: "🌟"
    },
    {
      title: "Future you will thank you",
      message: "Document what matters",
      emotionalAppeal: "Imagine finding a detailed memory from your grandmother's ordinary Tuesday. That's what you're creating right now.",
      icon: "💝"
    }
  ],
  letter: [
    {
      title: "Words they'll read forever",
      message: "Write a letter to someone you love",
      emotionalAppeal: "There are things you want to say. Things they need to hear. Don't wait for the perfect moment — this is it.",
      icon: "✉️"
    },
    {
      title: "What would you tell them?",
      message: "Start a time-capsule letter",
      emotionalAppeal: "Imagine your child opening a letter from you on their wedding day, their 40th birthday, or their hardest day. You can give them that gift today.",
      icon: "💌"
    },
    {
      title: "The letter only you can write",
      message: "Express what's in your heart",
      emotionalAppeal: "No one else can write this letter. Your words, your love, your wisdom — they're waiting to be shared.",
      icon: "❤️"
    }
  ],
  streak: [
    {
      title: "Keep your legacy alive",
      message: "You're on a {streak}-day streak!",
      emotionalAppeal: "Every day you show up is another day your story grows. Don't break the chain — your future family is counting on you.",
      icon: "🔥"
    },
    {
      title: "You're building something beautiful",
      message: "{streak} days of memories",
      emotionalAppeal: "Consistency is how legacies are built. You're not just posting — you're creating a treasure for generations.",
      icon: "⭐"
    }
  ],
  milestone: [
    {
      title: "You've preserved 100 memories!",
      message: "Your legacy is growing",
      emotionalAppeal: "100 moments that would have been lost forever. 100 stories your family will cherish. You're doing something incredible.",
      icon: "🎉"
    },
    {
      title: "1 year of memories",
      message: "Happy Heirloom anniversary!",
      emotionalAppeal: "365 days of preserving what matters most. Your dedication to your family's story is a gift beyond measure.",
      icon: "🎂"
    }
  ],
  inactivity: [
    {
      title: "We miss you",
      message: "It's been a while since your last memory",
      emotionalAppeal: "Life gets busy, but memories don't wait. What's happened since we last heard from you? Your family will want to know.",
      icon: "💭"
    },
    {
      title: "Time is passing",
      message: "Don't let another week slip by",
      emotionalAppeal: "Every day without a memory is a day lost to time. Even one sentence, one photo, one moment — it all matters.",
      icon: "⏳"
    },
    {
      title: "They're waiting for your story",
      message: "Pick up where you left off",
      emotionalAppeal: "Your voice, your words, your memories — they're irreplaceable. And they're waiting to be shared.",
      icon: "🌅"
    }
  ],
  family: [
    {
      title: "{name} added a new memory",
      message: "See what your family is sharing",
      emotionalAppeal: "Your family is building their legacy too. Together, you're creating something that will last forever.",
      icon: "👨‍👩‍👧‍👦"
    },
    {
      title: "{name} mentioned you",
      message: "You're part of their story",
      emotionalAppeal: "You matter to them. Your presence in their memories shows how much you mean.",
      icon: "💕"
    }
  ],
  seasonal: [
    {
      title: "Capture this holiday season",
      message: "The traditions, the laughter, the love",
      emotionalAppeal: "Holidays come and go, but the feelings can last forever. What made this year special?",
      icon: "🎄"
    },
    {
      title: "Mother's Day reflection",
      message: "Write to the mothers in your life",
      emotionalAppeal: "Whether she's here or in your heart, your words about her matter. What do you want her to know?",
      icon: "💐"
    },
    {
      title: "A new year, new memories",
      message: "What are your hopes for this year?",
      emotionalAppeal: "Future you will look back at this moment. What message do you want to send forward in time?",
      icon: "🎆"
    }
  ]
};

// Notification Component
const NotificationCard: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction: (route: string) => void;
}> = ({ notification, onDismiss, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25 }}
      className="relative bg-void-elevated border border-gold/20 rounded-2xl p-5 mb-4 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{notification.icon}</span>
            <div>
              <h3 className="text-paper font-display text-lg">{notification.title}</h3>
              <p className="text-paper/50 text-sm">{notification.message}</p>
            </div>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="text-paper/30 hover:text-paper/60 transition-colors p-1"
          >
            ✕
          </button>
        </div>
        
        {/* Emotional Appeal - The Heart of the Notification */}
        <div className="bg-void/50 rounded-xl p-4 mb-4 border-l-2 border-gold/50">
          <p className="text-paper/80 text-sm leading-relaxed italic">
            "{notification.emotionalAppeal}"
          </p>
        </div>
        
        {/* Action Button */}
        {notification.action && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAction(notification.action!.route)}
            className="w-full py-3 bg-gradient-to-r from-gold to-gold-dim text-void-deep rounded-xl font-semibold tracking-wide transition-all hover:shadow-lg hover:shadow-gold/20"
          >
            {notification.action.label}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Toast Notification (for push-style alerts)
const NotificationToast: React.FC<{
  notification: Notification;
  onDismiss: () => void;
  onAction: () => void;
}> = ({ notification, onDismiss, onAction }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -100, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: -100, x: '-50%' }}
      className="fixed top-6 left-1/2 z-50 w-full max-w-md"
    >
      <div className="bg-void-elevated border border-gold/30 rounded-2xl p-4 shadow-2xl shadow-void/50 mx-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{notification.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-paper font-display text-base mb-1">{notification.title}</h4>
            <p className="text-paper/60 text-sm line-clamp-2">{notification.emotionalAppeal}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-paper/30 hover:text-paper/60 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-2 text-paper/50 text-sm hover:text-paper transition-colors"
          >
            Later
          </button>
          <button
            onClick={onAction}
            className="flex-1 py-2 bg-gold/20 text-gold rounded-lg text-sm font-medium hover:bg-gold/30 transition-colors"
          >
            {notification.action?.label || 'Open'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Notification Center Panel
const NotificationCenter: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onAction: (route: string) => void;
  onClearAll: () => void;
}> = ({ isOpen, onClose, notifications, onDismiss, onAction, onClearAll }) => {
  const unreadCount = notifications.filter(n => !n.read).length;

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
            className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm z-40"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-void border-l border-gold/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gold/10 flex items-center justify-between">
              <div>
                <h2 className="text-paper font-display text-xl">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-gold text-sm">{unreadCount} new reminders</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-paper/40 text-sm hover:text-paper transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-paper/60 hover:text-paper transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl mb-4 block">✨</span>
                  <p className="text-paper/60">You're all caught up!</p>
                  <p className="text-paper/40 text-sm mt-2">
                    We'll remind you when it's time to add to your legacy.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map(notification => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onDismiss={onDismiss}
                      onAction={onAction}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Notification Bell Icon with Badge
const NotificationBell: React.FC<{
  count: number;
  onClick: () => void;
}> = ({ count, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative p-2 text-paper/60 hover:text-gold transition-colors"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blood text-paper text-xs font-bold rounded-full flex items-center justify-center"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.button>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  // Generate a contextual reminder
  const generateReminder = (type: keyof typeof EMOTIONAL_PROMPTS, context?: Record<string, string>): Notification => {
    const prompts = EMOTIONAL_PROMPTS[type];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    let title = prompt.title;
    let message = prompt.message;
    let emotionalAppeal = prompt.emotionalAppeal;
    
    // Replace placeholders with context
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value);
        message = message.replace(`{${key}}`, value);
        emotionalAppeal = emotionalAppeal.replace(`{${key}}`, value);
      });
    }

    const actionMap: Record<string, { label: string; route: string }> = {
      voiceStory: { label: 'Record Now', route: '/record' },
      memory: { label: 'Add Memory', route: '/memories' },
      letter: { label: 'Write Letter', route: '/compose' },
      streak: { label: 'Continue Streak', route: '/dashboard' },
      milestone: { label: 'View Your Journey', route: '/wrapped' },
      inactivity: { label: 'Start Now', route: '/dashboard' },
      family: { label: 'View Activity', route: '/family' },
      seasonal: { label: 'Capture Moment', route: '/memories' },
    };

    return {
      id: Date.now().toString(),
      type: 'reminder',
      title,
      message,
      emotionalAppeal,
      icon: prompt.icon,
      action: actionMap[type],
      read: false,
      createdAt: new Date(),
    };
  };

  // Add a notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  // Show a toast notification
  const showToast = (type: keyof typeof EMOTIONAL_PROMPTS, context?: Record<string, string>) => {
    const notification = generateReminder(type, context);
    setToastNotification(notification);
    addNotification(notification);
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Mark as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Schedule daily reminder
  useEffect(() => {
    // Check if we should show a reminder (once per day)
    const lastReminder = localStorage.getItem('heirloom_last_reminder');
    const today = new Date().toDateString();
    
    if (lastReminder !== today) {
      // Randomly choose a reminder type
      const types: (keyof typeof EMOTIONAL_PROMPTS)[] = ['voiceStory', 'memory', 'letter'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      // Delay the reminder by a few seconds after page load
      const timer = setTimeout(() => {
        showToast(randomType);
        localStorage.setItem('heirloom_last_reminder', today);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    toastNotification,
    setToastNotification,
    showToast,
    addNotification,
    dismissNotification,
    clearAll,
    markAsRead,
    generateReminder,
    NotificationCenter: (props: Omit<React.ComponentProps<typeof NotificationCenter>, 'notifications' | 'isOpen' | 'onClose' | 'onDismiss' | 'onClearAll'>) => (
      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onDismiss={dismissNotification}
        onClearAll={clearAll}
        {...props}
      />
    ),
    NotificationBell: () => (
      <NotificationBell count={unreadCount} onClick={() => setIsOpen(true)} />
    ),
    NotificationToast: () => (
      <AnimatePresence>
        {toastNotification && (
          <NotificationToast
            notification={toastNotification}
            onDismiss={() => setToastNotification(null)}
            onAction={() => {
              if (toastNotification.action) {
                window.location.href = toastNotification.action.route;
              }
              setToastNotification(null);
            }}
          />
        )}
      </AnimatePresence>
    ),
  };
};

// Notification Settings Component
export const NotificationSettings: React.FC<{
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => void;
}> = ({ settings, onUpdate }) => {
  const toggleSetting = (key: keyof NotificationSettings) => {
    if (typeof settings[key] === 'boolean') {
      onUpdate({ ...settings, [key]: !settings[key] });
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-paper font-display text-xl mb-4">Reminder Settings</h3>
      
      <p className="text-paper/60 text-sm mb-6">
        We'll gently remind you to preserve your memories. Our reminders are designed 
        to inspire, not overwhelm — because your legacy matters.
      </p>

      <div className="space-y-4">
        {[
          { key: 'dailyReminders', label: 'Daily Inspiration', desc: 'A gentle daily nudge to add to your legacy' },
          { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your family\'s activity' },
          { key: 'streakAlerts', label: 'Streak Reminders', desc: 'Keep your memory streak alive' },
          { key: 'familyActivity', label: 'Family Updates', desc: 'When loved ones add memories' },
          { key: 'milestoneAlerts', label: 'Milestone Celebrations', desc: 'Celebrate your legacy journey' },
        ].map(item => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-void-elevated rounded-xl border border-gold/10"
          >
            <div>
              <h4 className="text-paper font-medium">{item.label}</h4>
              <p className="text-paper/50 text-sm">{item.desc}</p>
            </div>
            <button
              onClick={() => toggleSetting(item.key as keyof NotificationSettings)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings[item.key as keyof NotificationSettings]
                  ? 'bg-gold'
                  : 'bg-void border border-paper/20'
              }`}
            >
              <motion.div
                animate={{
                  x: settings[item.key as keyof NotificationSettings] ? 24 : 2,
                }}
                className="absolute top-1 w-4 h-4 bg-paper rounded-full shadow"
              />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gold/10">
        <h4 className="text-paper font-medium mb-3">Quiet Hours</h4>
        <p className="text-paper/50 text-sm mb-4">
          We won't disturb you during these hours.
        </p>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-paper/60 text-sm block mb-1">Start</label>
            <input
              type="time"
              value={settings.quietHoursStart}
              onChange={(e) => onUpdate({ ...settings, quietHoursStart: e.target.value })}
              className="w-full bg-void border border-gold/20 rounded-lg px-3 py-2 text-paper"
            />
          </div>
          <div className="flex-1">
            <label className="text-paper/60 text-sm block mb-1">End</label>
            <input
              type="time"
              value={settings.quietHoursEnd}
              onChange={(e) => onUpdate({ ...settings, quietHoursEnd: e.target.value })}
              className="w-full bg-void border border-gold/20 rounded-lg px-3 py-2 text-paper"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h4 className="text-paper font-medium mb-3">Preferred Reminder Time</h4>
        <input
          type="time"
          value={settings.preferredTime}
          onChange={(e) => onUpdate({ ...settings, preferredTime: e.target.value })}
          className="w-full bg-void border border-gold/20 rounded-lg px-3 py-2 text-paper"
        />
        <p className="text-paper/40 text-sm mt-2">
          We'll send your daily inspiration around this time.
        </p>
      </div>
    </div>
  );
};

export default NotificationCenter;
export { NotificationCard, NotificationToast, NotificationBell, EMOTIONAL_PROMPTS };
