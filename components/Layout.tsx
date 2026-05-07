import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, Sun, Moon, ShoppingCart, Bell, Trash2, CheckCircle, LayoutDashboard, Store, Package, Truck } from 'lucide-react';
import { User, UserRole, Item } from '../types';
import { useNotificationStore } from '../services/notificationStore';
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

  const notifIcon = (type: string) => {
    if (type === 'new_item') return <Package size={16} />;
    if (type === 'new_order') return <Bell size={16} />;
    if (type === 'task_update') return <Truck size={16} />;
    if (type === 'order_update') return <CheckCircle size={16} />;
    return <Bell size={16} />;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md border-b border-eco-100 dark:border-dark-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/ecofeast-logo.svg" alt="EcoFeast logo" className="w-10 h-10 rounded-full" />
              <span className="text-2xl font-heading font-bold text-gray-900 dark:text-white">EcoFeast</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-eco-600 dark:hover:text-eco-400 ${
                    location.pathname === link.path ? 'text-eco-600 dark:text-eco-400' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Auth & Theme Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-800 transition-colors"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  {/* Notification Center */}
                  <div className="relative">
                    <button 
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setNotifView('all');
                      }} 
                      className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-eco-600"
                    >
                      <Bell size={22} />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown */}
                    {isNotificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                        <div className="absolute right-0 mt-2 w-[22rem] bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                          <div className="p-4 border-b border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-950">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {unreadCount > 0 && (
                                  <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-semibold text-eco-600 hover:underline flex items-center gap-1"
                                  >
                                    <CheckCircle size={12} /> Mark all
                                  </button>
                                )}
                                <button
                                  onClick={clearAll}
                                  className="text-xs font-semibold text-red-500 hover:underline flex items-center gap-1"
                                >
                                  <Trash2 size={12} /> Clear
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => setNotifView('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                  notifView === 'all'
                                    ? 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white'
                                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                All
                              </button>
                              <button
                                onClick={() => setNotifView('unread')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                  notifView === 'unread'
                                    ? 'bg-white dark:bg-dark-900 border-gray-200 dark:border-dark-700 text-gray-900 dark:text-white'
                                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                Unread
                              </button>
                            </div>
                          </div>

                          <div className="max-h-[65vh] overflow-y-auto">
                            {visibleNotifications.length === 0 ? (
                              <div className="p-10 text-center text-gray-500 text-sm">
                                {notifView === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-100 dark:divide-dark-800">
                                {visibleNotifications.map((notif) => (
                                  <button
                                    key={notif.id}
                                    onClick={() => {
                                      markAsRead(notif.id);
                                      setIsNotificationsOpen(false);
                                      if (notif.link) navigate(notif.link);
                                    }}
                                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${
                                      !notif.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                                    }`}
                                  >
                                    <div className="flex gap-3">
                                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        !notif.read ? 'bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-300' : 'bg-gray-100 text-gray-500 dark:bg-dark-800 dark:text-gray-300'
                                      }`}>
                                        {notifIcon(notif.type)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex justify-between items-start gap-3">
                                          <span className="font-bold text-sm text-gray-900 dark:text-white truncate">{notif.title}</span>
                                          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTimeAgo(notif.timestamp)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{notif.message}</p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {user.role === 'consumer' && (
                      <button onClick={onOpenCart} className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-eco-600">
                          <ShoppingCart size={22} />
                          {cartCount > 0 && (
                              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {cartCount}
                              </span>
                          )}
                      </button>
                  )}
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)} 
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-eco-700 dark:hover:text-eco-400 py-2"
                    >
                      <UserIcon size={18} />
                      <span className="font-medium">{user.name}</span>
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
                  className="bg-eco-600 hover:bg-eco-700 text-white px-5 py-2 rounded-full font-medium transition-transform transform hover:scale-105 shadow-md"
                >
                  Join the Mission
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
               <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-300"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
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

      {/* Auth Modal */}
      <ModalShell
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        maxWidthClassName="max-w-2xl"
        panelClassName="max-h-[92vh]"
        contentClassName="max-h-[92vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="space-y-6">
          <ModalHeader
            title={authMode === 'login' ? 'Welcome Back' : 'Join EcoFeast'}
            description={authMode === 'login' ? 'Access your orders, saved impact, and dashboards from one clean workspace.' : 'Create a polished account experience for customers, retailers, charities, and volunteers.'}
            eyebrow={authMode === 'login' ? 'Account Access' : 'Create Account'}
            align="center"
          />

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {authMode === 'signup' && (
              <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-dark-800 dark:bg-dark-950/60">
                <label className={fieldLabelClassName}>I Am Joining As</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {['consumer', 'retailer', 'charity', 'volunteer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r as UserRole)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition-all ${
                        selectedRole === r
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-[0_12px_24px_rgba(22,163,74,0.12)] dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={fieldLabelClassName}>Email</label>
                <input
                  type="email"
                  required
                  className={inputClassName}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={fieldLabelClassName}>Password</label>
                <input
                  type="password"
                  required
                  className={inputClassName}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                {authMode === 'signup' && (
                  <p className={helperTextClassName}>Choose a secure password with at least 6 characters.</p>
                )}
              </div>

              {authMode === 'signup' && selectedRole === 'consumer' && (
                <div className="sm:col-span-2">
                  <label className={fieldLabelClassName}>Full Name</label>
                  <input
                    type="text"
                    required
                    className={inputClassName}
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              {authMode === 'signup' && (selectedRole === 'retailer' || selectedRole === 'charity') && (
                <>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClassName}>Organization Name</label>
                    <input
                      type="text"
                      required
                      className={inputClassName}
                      placeholder="Business or organization name"
                      value={formData.orgName}
                      onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClassName}>Address</label>
                    <input
                      type="text"
                      required
                      className={inputClassName}
                      placeholder="Street, city, and area details"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClassName}>Phone</label>
                    <input
                      type="tel"
                      required
                      className={inputClassName}
                      placeholder="Primary contact number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </>
              )}

              {authMode === 'signup' && selectedRole === 'volunteer' && (
                <>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClassName}>Full Name</label>
                    <input
                      type="text"
                      required
                      className={inputClassName}
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClassName}>Vehicle Type</label>
                    <select
                      className={selectClassName}
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    >
                      <option value="">Select a vehicle</option>
                      <option value="bike">Bicycle</option>
                      <option value="scooter">Scooter/Bike</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {authError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                {authError}
              </div>
            )}

            <button disabled={authLoading} className={`w-full ${primaryButtonClassName}`}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <div className="flex flex-col items-center justify-between gap-3 rounded-[22px] border border-slate-200/70 bg-slate-50/80 px-4 py-4 text-sm text-slate-500 dark:border-dark-800 dark:bg-dark-950/60 dark:text-gray-400 sm:flex-row">
            <span>{authMode === 'login' ? 'New to EcoFeast?' : 'Already have an account?'}</span>
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className={secondaryButtonClassName}
            >
              {authMode === 'login' ? 'Create Account' : 'Log In'}
            </button>
          </div>
        </div>
      </ModalShell>

    </div>
  );
};



