import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  Inbox, 
  Package, 
  Truck, 
  Wallet, 
  GraduationCap, 
  FileText, 
  Tag, 
  LifeBuoy, 
  AlertCircle, 
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { notificationApi, adminNotificationApi } from '../api';

/**
 * Format timestamp into human-readable relative time string
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/**
 * Get category icon and styling
 */
function getCategoryMeta(category) {
  switch (category) {
    case 'ORDER':
      return {
        icon: Package,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        label: 'Order',
      };
    case 'SHIPMENT':
    case 'SHIPPING':
      return {
        icon: Truck,
        color: 'text-sky-700 bg-sky-50 border-sky-200',
        label: 'Shipping',
      };
    case 'WALLET':
    case 'REFUND':
      return {
        icon: Wallet,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        label: 'Wallet',
      };
    case 'TRAINING':
    case 'ENROLLMENT':
      return {
        icon: GraduationCap,
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        label: 'Training',
      };
    case 'BLOG':
    case 'CONTENT':
      return {
        icon: FileText,
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        label: 'Article',
      };
    case 'PROMO':
    case 'PROMOTION':
      return {
        icon: Tag,
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        label: 'Promo',
      };
    case 'SUPPORT':
      return {
        icon: LifeBuoy,
        color: 'text-orange-700 bg-orange-50 border-orange-200',
        label: 'Support',
      };
    case 'ADMIN':
      return {
        icon: ShieldCheck,
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        label: 'Admin Alert',
      };
    default:
      return {
        icon: AlertCircle,
        color: 'text-forest-700 bg-forest-50 border-forest-200',
        label: 'Update',
      };
  }
}

/**
 * Resolve target deep-link destination for a notification.
 * Intelligently maps orders, support tickets, masterclasses, and wallet transactions
 * to their specific detail screens or modals.
 */
export function resolveNotificationUrl(notification, isAdmin = false) {
  if (!notification) return null;

  const rawUrl = notification.actionUrl?.trim();
  const entityId = notification.entityId;
  const entityType = (notification.entityType || '').toUpperCase();
  const category = (notification.category || '').toUpperCase();
  const eventType = (notification.eventType || '').toUpperCase();

  // 1. If explicit actionUrl provided, normalize legacy or non-standard paths
  if (rawUrl) {
    if (isAdmin) {
      if (rawUrl.includes('/admin?tab=orders') || rawUrl.includes('/admin/orders')) {
        const idMatch = rawUrl.match(/[?&](?:orderId|id)=([^&]+)/);
        const targetId = idMatch ? idMatch[1] : entityId;
        return targetId ? `/admin/orders?orderId=${targetId}` : '/admin/orders';
      }
      if (rawUrl.includes('/admin?tab=support') || rawUrl.includes('/admin/support')) {
        const idMatch = rawUrl.match(/[?&](?:ticketId|id)=([^&]+)/);
        const targetId = idMatch ? idMatch[1] : entityId;
        return targetId ? `/admin/support?ticketId=${targetId}` : '/admin/support';
      }
      if (rawUrl.includes('/admin?tab=wallet') || rawUrl.includes('/admin?tab=finance')) {
        return '/admin/finance';
      }
    } else {
      // Customer Portal URL normalizations
      if (rawUrl.startsWith('/orders/')) {
        const orderNumOrId = rawUrl.split('/orders/')[1]?.split('?')[0];
        return `/dashboard?tab=activeTrack${orderNumOrId ? `&orderId=${orderNumOrId}` : ''}`;
      }
      if (rawUrl.includes('/dashboard?tab=orders') || rawUrl.includes('/dashboard?tab=activeTrack') || rawUrl.includes('/dashboard?tab=history')) {
        const idMatch = rawUrl.match(/[?&](?:orderId|id)=([^&]+)/);
        const targetId = idMatch ? idMatch[1] : entityId;
        const baseTab = rawUrl.includes('tab=history') ? 'history' : 'activeTrack';
        return `/dashboard?tab=${baseTab}${targetId ? `&orderId=${targetId}` : ''}`;
      }
      if (rawUrl.includes('/dashboard?tab=support')) {
        const idMatch = rawUrl.match(/[?&](?:ticketId|id)=([^&]+)/);
        const targetId = idMatch ? idMatch[1] : entityId;
        return `/dashboard?tab=support${targetId ? `&ticketId=${targetId}` : ''}`;
      }
      if (rawUrl.includes('/dashboard?tab=training') || rawUrl.includes('/dashboard?tab=trainings')) {
        const idMatch = rawUrl.match(/[?&](?:bookingId|id)=([^&]+)/);
        const targetId = idMatch ? idMatch[1] : entityId;
        return `/dashboard?tab=trainings${targetId ? `&bookingId=${targetId}` : ''}`;
      }
    }
    return rawUrl;
  }

  // 2. Synthesize route if actionUrl was absent
  if (isAdmin) {
    if (category === 'ORDER' || entityType === 'ORDER' || eventType.includes('ORDER')) {
      return entityId ? `/admin/orders?orderId=${entityId}` : '/admin/orders';
    }
    if (category === 'SUPPORT' || entityType === 'SUPPORT_TICKET' || eventType.includes('SUPPORT') || eventType.includes('TICKET')) {
      return entityId ? `/admin/support?ticketId=${entityId}` : '/admin/support';
    }
    if (category === 'WALLET' || entityType === 'WALLET' || eventType.includes('WALLET') || eventType.includes('WITHDRAWAL')) {
      return '/admin/finance';
    }
    if (category === 'TRAINING' || category === 'ENROLLMENT' || entityType.includes('TRAINING') || eventType.includes('ENROLLMENT')) {
      return '/admin/enrollments';
    }
    if (category === 'SHIPPING' || category === 'SHIPMENT' || eventType.includes('SHIPMENT')) {
      return entityId ? `/admin/shipping?orderId=${entityId}` : '/admin/shipping';
    }
    return '/admin';
  } else {
    if (category === 'ORDER' || entityType === 'ORDER' || eventType.includes('ORDER')) {
      return `/dashboard?tab=activeTrack${entityId ? `&orderId=${entityId}` : ''}`;
    }
    if (category === 'SUPPORT' || entityType === 'SUPPORT_TICKET' || eventType.includes('SUPPORT') || eventType.includes('TICKET')) {
      return `/dashboard?tab=support${entityId ? `&ticketId=${entityId}` : ''}`;
    }
    if (category === 'TRAINING' || category === 'ENROLLMENT' || entityType.includes('TRAINING') || eventType.includes('ENROLLMENT')) {
      return `/dashboard?tab=trainings${entityId ? `&bookingId=${entityId}` : ''}`;
    }
    if (category === 'WALLET' || entityType === 'WALLET' || eventType.includes('WALLET') || eventType.includes('REFUND')) {
      return '/dashboard?tab=wallet';
    }
    if (category === 'SHIPPING' || category === 'SHIPMENT' || eventType.includes('SHIPMENT')) {
      return `/dashboard?tab=activeTrack${entityId ? `&orderId=${entityId}` : ''}`;
    }
    if (category === 'CONTENT' || category === 'BLOG' || eventType.includes('BLOG')) {
      return '/blog';
    }
    if (category === 'PROMOTION' || category === 'PROMO' || eventType.includes('PROMOTION')) {
      return '/products';
    }
    return '/dashboard';
  }
}

export default function NotificationCenter({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const containerRef = useRef(null);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  // Helper to fetch current unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      if (isAdmin) {
        const res = await adminNotificationApi.getInAppUnreadCount();
        const count = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
        setUnreadCount(Number(count) || 0);
      } else {
        const res = await notificationApi.getUnreadCount();
        const count = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
        setUnreadCount(Number(count) || 0);
      }
    } catch {
      // Fail gracefully silently for polling
    }
  }, [user, isAdmin]);

  // Helper to fetch notifications feed
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const params = {
        page: 0,
        size: 30,
        ...(activeTab === 'UNREAD' ? { unreadOnly: true } : {}),
      };

      let res;
      if (isAdmin) {
        res = await adminNotificationApi.getInAppNotifications(params);
      } else {
        res = await notificationApi.getNotifications(params);
      }

      const items = res.data?.data?.content || res.data?.content || (Array.isArray(res.data?.data) ? res.data.data : []);
      setNotifications(items);
      
      // Update unread count if returned or compute
      const unreadInBatch = items.filter((n) => !n.isRead).length;
      if (activeTab === 'ALL') {
        setUnreadCount((prev) => Math.max(prev, unreadInBatch));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, activeTab]);

  // Initial and background polling (45s interval, guarded by tab visibility)
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchUnreadCount]);

  // Re-fetch notification feed when panel opens or activeTab changes
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Close panel on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Single mark as read
  const handleMarkAsRead = async (e, notification) => {
    e.stopPropagation();
    if (notification.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      if (isAdmin) {
        await adminNotificationApi.markInAppAsRead(notification.id);
      } else {
        await notificationApi.markAsRead(notification.id);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      if (isAdmin) {
        await adminNotificationApi.markInAppAllAsRead();
      } else {
        await notificationApi.markAllAsRead();
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Card click or "View details" button: mark read and navigate to respective details screen
  const handleNotificationClick = (eventOrNotif, maybeNotif) => {
    let e = null;
    let notification = null;
    if (maybeNotif) {
      e = eventOrNotif;
      notification = maybeNotif;
    } else {
      notification = eventOrNotif;
    }

    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!notification) return;

    if (!notification.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} }, notification);
    }
    const targetUrl = resolveNotificationUrl(notification, isAdmin);
    if (targetUrl) {
      setIsOpen(false);
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(targetUrl);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef} data-testid="notification-center">
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-testid="notification-bell-btn"
        className="relative p-2.5 rounded-xl bg-surface-neutral hover:bg-surface-cream border border-surface-border text-typography-primary transition-all min-h-[44px] min-w-[44px] flex items-center justify-center button-press hover-lift"
      >
        <Bell className="w-5 h-5 text-forest-700" />
        {unreadCount > 0 && (
          <span 
            data-testid="notification-badge"
            className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-forest-700 text-white text-[10px] font-bold rounded-pill flex items-center justify-center shadow-level-1 ring-2 ring-white animate-scale-in"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Dropdown Panel */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Notification Center"
          data-testid="notification-panel"
          className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[410px] max-w-[420px] bg-surface-white rounded-2xl shadow-level-3 border border-surface-border overflow-hidden z-50 animate-scale-in"
        >
          {/* Header */}
          <div className="p-4 bg-surface-cream/70 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-forest-700/10 flex items-center justify-center text-forest-800">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-forest-900 leading-tight">
                  {isAdmin ? 'Operational Alerts' : 'Notifications'}
                </h3>
                <p className="text-[11px] text-typography-muted font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  data-testid="mark-all-read-btn"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900 px-2 py-1 rounded-lg hover:bg-forest-100 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close notification panel"
                className="p-1 rounded-lg text-typography-muted hover:text-typography-primary hover:bg-surface-neutral transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center border-b border-surface-border px-4 bg-surface-white">
            <button
              onClick={() => setActiveTab('ALL')}
              data-testid="tab-all"
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'ALL'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-typography-muted hover:text-typography-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              data-testid="tab-unread"
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'UNREAD'
                  ? 'border-forest-700 text-forest-800'
                  : 'border-transparent text-typography-muted hover:text-typography-primary'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-forest-100 text-forest-800 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Feed Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-surface-border">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-typography-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
                <span className="text-xs font-medium">Loading updates...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-surface-cream flex items-center justify-center text-forest-700">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-forest-900 mt-1">
                  {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-xs text-typography-muted max-w-[240px]">
                  {activeTab === 'UNREAD'
                    ? 'You are up to date on all announcements and events.'
                    : 'Important updates regarding orders, shipments, and courses will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const meta = getCategoryMeta(notification.category);
                const IconComponent = meta.icon;
                const targetUrl = resolveNotificationUrl(notification, isAdmin);

                return (
                  <div
                    key={notification.id}
                    onClick={(e) => handleNotificationClick(e, notification)}
                    data-testid={`notification-item-${notification.id}`}
                    className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 ${
                      notification.isRead 
                        ? 'bg-surface-white hover:bg-surface-cream/50' 
                        : 'bg-forest-50/40 hover:bg-forest-50/70'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-typography-secondary">
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-typography-muted">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <span 
                              className="w-2 h-2 rounded-full bg-forest-700" 
                              title="Unread"
                            />
                          )}
                        </div>
                      </div>

                      <h4 className={`text-xs font-semibold leading-snug line-clamp-1 ${
                        notification.isRead ? 'text-forest-900' : 'text-forest-950 font-bold'
                      }`}>
                        {notification.title || notification.subject || 'Notification'}
                      </h4>

                      <p className="text-[11px] text-typography-muted leading-relaxed line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>

                      {/* Action Links & Read Button */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {targetUrl ? (
                          <button
                            type="button"
                            onClick={(e) => handleNotificationClick(e, notification)}
                            data-testid={`notification-view-details-btn-${notification.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:text-forest-900 group-hover:underline focus:outline-none focus:underline"
                          >
                            <span>View details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : <span />}

                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification)}
                            aria-label="Mark as read"
                            className="text-[10px] font-semibold text-typography-muted hover:text-forest-800 px-2 py-0.5 rounded hover:bg-forest-100/60 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-surface-neutral/60 border-t border-surface-border text-center">
            <span className="text-[10px] font-medium text-typography-muted">
              Notifications are retained for 30 days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
