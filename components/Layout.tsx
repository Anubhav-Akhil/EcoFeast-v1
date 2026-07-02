import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, Sun, Moon, ShoppingCart, Bell, BellOff, LayoutDashboard, Store, Package, Truck, ShoppingBag, ClipboardList, CheckCheck, Building2, Heart, Leaf } from 'lucide-react';
import { User, UserRole, Item } from '../types';
import { useNotificationStore } from '../services/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fieldLabelClassName,
  helperTextClassName,
  inputClassName,
  ModalHeader,
  ModalShell,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from './ui';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'signup') => void;
  isDark: boolean;
  toggleTheme: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  handleLogin: (email: string, role: UserRole, details: any, mode: 'login' | 'signup') => void;
  cartCount: number;
  onOpenCart: () => void;
  initialAuthRole?: UserRole;
  initialAuthMode?: 'login' | 'signup';
}

export const Layout: React.FC<LayoutProps> = ({
  children, user, onLogout, onOpenAuth, isDark, toggleTheme,
  authModalOpen, setAuthModalOpen, handleLogin, cartCount, onOpenCart, initialAuthRole, initialAuthMode
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifView, setNotifView] = useState<'all' | 'unread'>('all');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('consumer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    orgName: '',
    phone: '',
    address: '',
    vehicleType: ''
  });

  React.useEffect(() => {
    if (initialAuthRole) setSelectedRole(initialAuthRole);
    if (initialAuthMode) setAuthMode(initialAuthMode);
  }, [initialAuthRole, initialAuthMode, authModalOpen]);

  React.useEffect(() => {
    if (authModalOpen) {
      setAuthError(null);
    }
  }, [authModalOpen, authMode, selectedRole]);

  const navLinks = (() => {
    if (!user) {
      // Logged-out: full marketing nav
      return [
        { name: 'Home', path: '/' },
        { name: 'Marketplace', path: '/marketplace' },
        { name: 'Partners', path: '/partners' },
        { name: 'Charities', path: '/charities' },
        { name: 'Volunteers', path: '/volunteers' },
        { name: 'About', path: '/about' },
      ];
    }
    if (user.role === 'consumer') {
      return [
        { name: 'Home', path: '/' },
        { name: 'Marketplace', path: '/marketplace' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'About', path: '/about' },
      ];
    }
    // retailer, charity, volunteer â€” focused nav
    return [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Marketplace', path: '/marketplace' },
    ];
  })();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await handleLogin(formData.email, selectedRole, formData, authMode);
    } catch (error: any) {
      setAuthError(error?.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const visibleNotifications = (notifView === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications
  ).slice(0, 50);

  const formatTimeAgo = (ts: number) => {
    const diffMs = Date.now() - ts;
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  };

  // icon + color config per notification type (no emojis)
  const notifTypeConfig: Record<string, { Icon: React.ElementType; iconBg: string; iconColor: string }> = {
    new_item: { Icon: ShoppingBag, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    new_order: { Icon: ClipboardList, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    order_update: { Icon: Package, iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-600 dark:text-sky-400' },
    task_update: { Icon: Truck, iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
    system: { Icon: Bell, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400' },
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/ecofeast-logo.svg" alt="EcoFeast logo" className="w-9 h-9 rounded-full transition-transform duration-700 group-hover:rotate-[360deg]" />
              <span className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-300">Eco</span><span className="text-slate-900 dark:text-white">Feast</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${location.pathname === link.path
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Auth & Theme Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  {/* Notification Center */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setNotifView('all');
                      }}
                      className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Bell size={19} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="absolute right-0 mt-2 w-[92vw] sm:w-[22rem] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/8 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            {/* Panel header */}
                            <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white">Notifications</h3>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  {unreadCount > 0 && (
                                    <button
                                      onClick={markAllAsRead}
                                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                      <CheckCheck size={13} /> Mark all read
                                    </button>
                                  )}
                                  <button
                                    onClick={clearAll}
                                    className="text-xs font-bold text-rose-500 hover:underline"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="mt-3 flex gap-1.5">
                                {(['all', 'unread'] as const).map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => setNotifView(v)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${notifView === v
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                      }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="max-h-[68vh] overflow-y-auto">
                              {visibleNotifications.length === 0 ? (
                                <div className="py-14 text-center">
                                  <BellOff size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                  <p className="text-sm font-medium text-slate-400 dark:text-slate-600">
                                    {notifView === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
                                  </p>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                  {visibleNotifications.map((notif, idx) => {
                                    const cfg = notifTypeConfig[notif.type] || notifTypeConfig.system;
                                    const Icon = cfg.Icon;
                                    return (
                                      <motion.button
                                        key={notif.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.025 }}
                                        onClick={() => {
                                          markAsRead(notif.id);
                                          setIsNotificationsOpen(false);
                                          if (notif.link) navigate(notif.link);
                                        }}
                                        className={`w-full text-left px-5 py-4 transition-all border-b border-slate-50 dark:border-white/5 relative group/notif ${
                                          !notif.read 
                                            ? 'bg-emerald-50/30 dark:bg-emerald-500/5' 
                                            : 'bg-white dark:bg-transparent'
                                        }`}
                                      >
                                        <div className="flex gap-4 items-start">
                                          {/* Icon tile */}
                                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                            !notif.read ? cfg.iconBg : 'bg-slate-100 dark:bg-slate-800/50'
                                          }`}>
                                            <Icon size={18} className={!notif.read ? cfg.iconColor : 'text-slate-400 dark:text-slate-500'} />
                                          </div>
                                          
                                          <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline gap-2 mb-1">
                                              <span className={`text-sm leading-snug transition-colors ${
                                                !notif.read 
                                                  ? 'font-black text-slate-900 dark:text-white' 
                                                  : 'font-bold text-slate-500 dark:text-slate-400'
                                              }`}>
                                                {notif.title}
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex-shrink-0">
                                                {formatTimeAgo(notif.timestamp)}
                                              </span>
                                            </div>
                                            
                                            <p className={`text-xs leading-snug transition-colors ${
                                              !notif.read 
                                                ? 'text-slate-600 dark:text-slate-300 font-medium' 
                                                : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                              {notif.message}
                                            </p>
                                            
                                            {notif.subtitle && (
                                              <div className={`inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                !notif.read 
                                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500'
                                              }`}>
                                                {notif.subtitle}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {!notif.read && (
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                          )}
                                        </div>
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {user.role === 'consumer' && (
                    <button onClick={onOpenCart} className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <ShoppingCart size={19} />
                      {cartCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  )}
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-black">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm font-semibold">{user.name}</span>
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-800">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to="/profile"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                            >
                              <UserIcon size={15} /> My Profile
                            </Link>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                            >
                              <LayoutDashboard size={15} /> My Dashboard
                            </Link>
                            {(user.role === 'consumer' || user.role === 'charity') && (
                              <Link
                                to="/dashboard?tab=orders"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                              >
                                <Package size={15} /> Your Orders
                              </Link>
                            )}
                            {(user.role === 'consumer') && (
                              <Link
                                to="/marketplace"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                              >
                                <Store size={15} /> Browse Marketplace
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-gray-100 dark:border-dark-800">
                            <button
                              onClick={() => { setIsProfileOpen(false); onLogout(); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2.5"
                            >
                              <LogOut size={15} /> Log Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onOpenAuth('consumer')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
                >
                  Join the Mission
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user && (
                <>
                  {/* Notification Center for Mobile */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setNotifView('all');
                      }}
                      className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Bell size={19} />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown for Mobile */}
                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="absolute right-0 mt-2 w-[92vw] sm:w-[22rem] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/8 rounded-2xl shadow-2xl z-50 overflow-hidden"
                          >
                            {/* Panel header */}
                            <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-white/6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white">Notifications</h3>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  {unreadCount > 0 && (
                                    <button
                                      onClick={markAllAsRead}
                                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                      <CheckCheck size={13} /> Mark all read
                                    </button>
                                  )}
                                  <button
                                    onClick={clearAll}
                                    className="text-xs font-bold text-rose-500 hover:underline"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="mt-3 flex gap-1.5">
                                {(['all', 'unread'] as const).map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => setNotifView(v)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize ${notifView === v
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                      }`}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="max-h-[68vh] overflow-y-auto">
                              {visibleNotifications.length === 0 ? (
                                <div className="py-14 text-center">
                                  <BellOff size={28} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                  <p className="text-sm font-medium text-slate-400 dark:text-slate-600">
                                    {notifView === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
                                  </p>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                  {visibleNotifications.map((notif, idx) => {
                                    const cfg = notifTypeConfig[notif.type] || notifTypeConfig.system;
                                    const Icon = cfg.Icon;
                                    return (
                                      <motion.button
                                        key={notif.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.025 }}
                                        onClick={() => {
                                          markAsRead(notif.id);
                                          setIsNotificationsOpen(false);
                                          if (notif.link) navigate(notif.link);
                                        }}
                                        className={`w-full text-left px-5 py-4 transition-all border-b border-slate-50 dark:border-white/5 relative group/notif ${
                                          !notif.read 
                                            ? 'bg-emerald-50/30 dark:bg-emerald-500/5' 
                                            : 'bg-white dark:bg-transparent'
                                        }`}
                                      >
                                        <div className="flex gap-4 items-start">
                                          {/* Icon tile */}
                                          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                            !notif.read ? cfg.iconBg : 'bg-slate-100 dark:bg-slate-800/50'
                                          }`}>
                                            <Icon size={18} className={!notif.read ? cfg.iconColor : 'text-slate-400 dark:text-slate-500'} />
                                          </div>
                                          
                                          <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline gap-2 mb-1">
                                              <span className={`text-sm leading-snug transition-colors ${
                                                !notif.read 
                                                  ? 'font-black text-slate-900 dark:text-white' 
                                                  : 'font-bold text-slate-500 dark:text-slate-400'
                                              }`}>
                                                {notif.title}
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex-shrink-0">
                                                {formatTimeAgo(notif.timestamp)}
                                              </span>
                                            </div>
                                            
                                            <p className={`text-xs leading-snug transition-colors ${
                                              !notif.read 
                                                ? 'text-slate-600 dark:text-slate-300 font-medium' 
                                                : 'text-slate-400 dark:text-slate-500'
                                            }`}>
                                              {notif.message}
                                            </p>
                                            
                                            {notif.subtitle && (
                                              <div className={`inline-flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                !notif.read 
                                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                  : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500'
                                              }`}>
                                                {notif.subtitle}
                                              </div>
                                            )}
                                          </div>
                                          
                                          {!notif.read && (
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                          )}
                                        </div>
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {user && user.role === 'consumer' && (
                <button onClick={onOpenCart} className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <ShoppingCart size={19} />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-eco-600 hover:bg-eco-50 dark:hover:bg-dark-800"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <div className="border-t border-gray-100 dark:border-dark-800 pt-4 mt-2">
                  <div className="px-3 py-2 flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-black">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-eco-600 hover:bg-eco-50 dark:hover:bg-dark-800"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-eco-600 hover:bg-eco-50 dark:hover:bg-dark-800"
                  >
                    My Dashboard
                  </Link>
                  {(user.role === 'consumer' || user.role === 'charity') && (
                    <Link
                      to="/dashboard?tab=orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-eco-600 hover:bg-eco-50 dark:hover:bg-dark-800"
                    >
                      Your Orders
                    </Link>
                  )}
                  {user.role === 'consumer' && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenCart();
                      }}
                      className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-eco-600 hover:bg-eco-50 dark:hover:bg-dark-800 flex items-center gap-2"
                    >
                      <ShoppingCart size={18} className="text-slate-400" /> Cart ({cartCount})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-eco-700 dark:text-eco-400 hover:bg-eco-50 dark:hover:bg-dark-800"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-eco-900 dark:bg-black text-white pt-16 pb-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/ecofeast-logo.svg" alt="EcoFeast logo" className="w-7 h-7 rounded-full" />
                <span className="text-2xl font-bold">EcoFeast</span>
              </div>
              <p className="text-eco-200 text-sm">
                Reducing food waste, one meal at a time. Connecting communities for a greener future.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Platform</h3>
              <ul className="space-y-2 text-eco-200 text-sm">
                <li><Link to="/marketplace" className="hover:text-white">Marketplace</Link></li>
                <li><Link to="/partners" className="hover:text-white">For Business</Link></li>
                <li><Link to="/charities" className="hover:text-white">For Charities</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white">How it Works</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-eco-200 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/impact" className="hover:text-white">Impact</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-eco-800 text-center text-eco-400 text-sm">
            Â© {new Date().getFullYear()} EcoFeast Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal — two-panel with smooth CSS transitions */}
      <ModalShell
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        maxWidthClassName={authMode === 'login' ? 'max-w-md' : 'max-w-2xl'}
        panelClassName="max-h-[92vh] transition-all duration-500 ease-in-out"
        contentClassName="max-h-[92vh] overflow-y-auto p-0"
      >
        <div className="relative overflow-hidden rounded-3xl">
          {/* Top gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <div className="flex flex-col sm:flex-row">
            {/* Decorative sidebar â€” always mounted, visibility via CSS */}
            <div
              className="hidden sm:flex flex-col justify-between bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white relative overflow-hidden flex-shrink-0 transition-all duration-500 ease-in-out"
              style={{
                width: authMode === 'signup' ? 208 : 0,
                padding: authMode === 'signup' ? '24px' : '0px',
                opacity: authMode === 'signup' ? 1 : 0,
              }}
            >
              <div className="absolute inset-0 dot-grid opacity-15" />
              <div className="relative z-10 min-w-[160px]">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                  <Leaf size={20} />
                </div>
                <h3 className="text-lg font-black leading-tight mb-2">Join the Food Rescue Movement</h3>
                <p className="text-xs text-white/70 leading-relaxed">Every signup helps reduce food waste in your community.</p>
              </div>
              <div className="relative z-10 space-y-3 mt-8 min-w-[160px]">
                {[
                  { icon: ShoppingCart, label: 'Save up to 70%', active: selectedRole === 'consumer' },
                  { icon: Building2, label: 'Zero waste stores', active: selectedRole === 'retailer' },
                  { icon: Heart, label: 'Feed communities', active: selectedRole === 'charity' },
                  { icon: Truck, label: 'Last-mile heroes', active: selectedRole === 'volunteer' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 ${item.active ? 'bg-white/20 text-white' : 'text-white/50'}`}>
                    <item.icon size={14} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Main form area */}
            <div className="flex-1 px-6 sm:px-8 pt-7 pb-7 space-y-5 overflow-y-auto" style={{ maxHeight: '85vh' }}>
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                  {authMode === 'login' ? 'Log In to EcoFeast' : 'Create Your Account'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  {authMode === 'login'
                    ? 'Access your dashboard, orders, and impact stats.'
                    : 'Pick your role below and fill in the details.'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {/* Role selector â€” slides open/closed via CSS */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: authMode === 'signup' ? 200 : 0,
                    opacity: authMode === 'signup' ? 1 : 0,
                  }}
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5">I Am Joining As</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { key: 'consumer', icon: ShoppingCart, label: 'Consumer', gradient: 'from-emerald-500 to-teal-500' },
                      { key: 'retailer', icon: Building2, label: 'Retailer', gradient: 'from-violet-500 to-purple-500' },
                      { key: 'charity', icon: Heart, label: 'Charity', gradient: 'from-rose-500 to-pink-500' },
                      { key: 'volunteer', icon: Truck, label: 'Volunteer', gradient: 'from-amber-500 to-orange-500' },
                    ] as const).map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setSelectedRole(r.key as UserRole)}
                        className={`relative flex flex-col items-center gap-1 rounded-2xl border py-3 px-1 text-xs font-bold transition-all duration-300 overflow-hidden ${selectedRole === r.key
                            ? 'border-transparent text-white shadow-lg scale-[1.03]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.02]'
                          }`}
                      >
                        {selectedRole === r.key && (
                          <motion.div
                            layoutId="authRoleHighlight"
                            className={`absolute inset-0 bg-gradient-to-br ${r.gradient}`}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <r.icon size={18} className="relative z-10" />
                        <span className="relative z-10 text-[10px]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider â€” slides with role selector */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: authMode === 'signup' ? 30 : 0,
                    opacity: authMode === 'signup' ? 1 : 0,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">Account Details</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>

                {/* Core fields â€” always visible */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Role-specific extra fields â€” slides open/closed */}
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: authMode === 'signup' ? 500 : 0,
                    opacity: authMode === 'signup' ? 1 : 0,
                  }}
                >
                  <div className="space-y-3 pt-1">
                    {(selectedRole === 'consumer' || selectedRole === 'volunteer') && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required={authMode === 'signup'}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    )}

                    {(selectedRole === 'retailer' || selectedRole === 'charity') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Organization Name</label>
                          <input
                            type="text"
                            required={authMode === 'signup'}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                            placeholder="Business or organization name"
                            value={formData.orgName}
                            onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Address</label>
                            <input
                              type="text"
                              required={authMode === 'signup'}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                              placeholder="Street, city"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Phone</label>
                            <input
                              type="tel"
                              required={authMode === 'signup'}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
                              placeholder="Contact number"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedRole === 'volunteer' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Vehicle Type</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200 appearance-none"
                          value={formData.vehicleType}
                          onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        >
                          <option value="">Select a vehicle</option>
                          <option value="bike">Bicycle</option>
                          <option value="scooter">Scooter / Motorbike</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {authError && (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                    {authError}
                  </div>
                )}

                <motion.button
                  disabled={authLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-black text-white hover:from-emerald-500 hover:to-teal-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Create Account'}
                </motion.button>
              </form>

              {/* Toggle login/signup */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                <span>{authMode === 'login' ? 'New to EcoFeast?' : 'Already have an account?'}</span>
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
                >
                  {authMode === 'login' ? 'Create Account' : 'Log In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

    </div>
  );
};

