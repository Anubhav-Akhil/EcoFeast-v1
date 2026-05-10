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
  onOpenAuth: (role?: UserRole) => void;
  isDark: boolean;
  toggleTheme: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (v: boolean) => void;
  handleLogin: (email: string, role: UserRole, details: any, mode: 'login' | 'signup') => void;
  cartCount: number;
  onOpenCart: () => void;
  initialAuthRole?: UserRole;
}

export const Layout: React.FC<LayoutProps> = ({
  children, user, onLogout, onOpenAuth, isDark, toggleTheme,
  authModalOpen, setAuthModalOpen, handleLogin, cartCount, onOpenCart, initialAuthRole
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
  }, [initialAuthRole, authModalOpen]);

  React.useEffect(() => {
    if (authModalOpen) {
      setAuthError(null);
    }
  }, [authModalOpen, authMode, selectedRole]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Partners', path: '/partners' },
    { name: 'Charities', path: '/charities' },
    { name: 'Volunteers', path: '/volunteers' },
    { name: 'About', path: '/about' },
  ];

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
                            className="absolute right-0 mt-2 w-[22rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/8 rounded-2xl shadow-2xl z-50 overflow-hidden"
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
                                        className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-white/4 transition-colors ${!notif.read ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''
                                          }`}
                                      >
                                        <div className="flex gap-3 items-start">
                                          {/* Icon tile */}
                                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.iconBg}`}>
                                            <Icon size={16} className={cfg.iconColor} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-baseline gap-2">
                                              <span className={`text-sm font-bold leading-snug ${notif.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                                                }`}>{notif.title}</span>
                                              <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTimeAgo(notif.timestamp)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">{notif.message}</p>
                                            {notif.subtitle && (
                                              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{notif.subtitle}</p>
                                            )}
                                          </div>
                                          {!notif.read && (
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
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
                            <Link
                              to="/marketplace"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                            >
                              <Store size={15} /> Browse Marketplace
                            </Link>
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
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
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
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-eco-700 dark:text-eco-400 bg-eco-50 dark:bg-dark-800 rounded-md"
                >
                  My Dashboard
                </Link>
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
            © {new Date().getFullYear()} EcoFeast Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal — premium dark glassmorphism */}
      <ModalShell
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        maxWidthClassName="max-w-lg"
        panelClassName="max-h-[92vh]"
        contentClassName="max-h-[92vh] overflow-y-auto p-0"
      >
        <div className="relative overflow-hidden rounded-3xl">
          {/* Top gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          <div className="px-8 pt-8 pb-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                  {authMode === 'login' ? 'Account Access' : 'Create Account'}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white">
                {authMode === 'login' ? 'Welcome Back' : 'Join EcoFeast'}
              </h2>

              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {authMode === 'login'
                  ? 'Access your orders, saved impact, and dashboards.'
                  : 'Pick your role and start rescuing food today.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">I Am Joining As</label>
                   <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {([
                      { key: 'consumer', icon: ShoppingCart, label: 'Consumer', color: 'text-emerald-500' },
                      { key: 'retailer', icon: Building2, label: 'Retailer', color: 'text-violet-500' },
                      { key: 'charity', icon: Heart, label: 'Charity', color: 'text-rose-500' },
                      { key: 'volunteer', icon: Truck, label: 'Volunteer', color: 'text-amber-500' },
                    ] as const).map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setSelectedRole(r.key as UserRole)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 px-2 text-sm font-bold transition-all ${selectedRole === r.key
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                      >
                        <r.icon size={20} className={selectedRole === r.key ? 'text-emerald-500' : r.color} />
                        <span className="text-xs">{r.label}</span>
                      </button>
                    ))}
                  </div>

                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                {authMode === 'signup' && selectedRole === 'consumer' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                )}

                {authMode === 'signup' && (selectedRole === 'retailer' || selectedRole === 'charity') && (
                  <>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Organization Name</label>
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        placeholder="Business or organization name"
                        value={formData.orgName}
                        onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Address</label>
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        placeholder="Street, city, and area details"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        placeholder="Primary contact number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {authMode === 'signup' && selectedRole === 'volunteer' && (
                  <>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Vehicle Type</label>
                      <select
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all appearance-none"
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
                  </>
                )}
              </div>

              {authError && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
                  {authError}
                </div>
              )}

              <button
                disabled={authLoading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3.5 text-sm font-black text-white hover:from-emerald-500 hover:to-teal-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>

            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-4 text-sm text-slate-500 sm:flex-row">
              <span>{authMode === 'login' ? 'New to EcoFeast?' : 'Already have an account?'}</span>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {authMode === 'login' ? 'Create Account' : 'Log In'}
              </button>
            </div>
          </div>
        </div>
      </ModalShell>

    </div>
  );
};



