import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon, LogOut, Sun, Moon, ShoppingCart, Bell, Trash2, CheckCircle } from 'lucide-react';
import { User, UserRole, Item } from '../types';
import { useNotificationStore } from '../services/notificationStore';

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

  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
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
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50 dark:bg-dark-950">
                          <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                          <div className="flex gap-2">
                            {unreadCount > 0 && (
                              <button onClick={markAllAsRead} className="text-xs text-eco-600 hover:underline flex items-center gap-1">
                                <CheckCircle size={12} /> Mark all read
                              </button>
                            )}
                            <button onClick={clearAll} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                              <Trash2 size={12} /> Clear
                            </button>
                          </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">No notifications yet.</div>
                          ) : (
                            <div className="divide-y divide-gray-100 dark:divide-dark-800">
                              {notifications.map((notif) => (
                                <div 
                                  key={notif.id} 
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setIsNotificationsOpen(false);
                                  }}
                                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">{notif.title}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
                  <div 
                    className="relative" 
                    onMouseEnter={() => setIsProfileOpen(true)} 
                    onMouseLeave={() => setIsProfileOpen(false)}
                  >
                    <Link to="/dashboard" className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-eco-700 dark:hover:text-eco-400 py-2">
                      <UserIcon size={18} />
                      <span className="font-medium">{user.name}</span>
                    </Link>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 top-full w-48 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                        <Link 
                          to="/dashboard" 
                          className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                        >
                          My Dashboard
                        </Link>
                        {(user.role === 'consumer' || user.role === 'charity') && (
                          <Link 
                            to="/dashboard?tab=orders" 
                            className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-eco-50 dark:hover:bg-dark-800 hover:text-eco-600 transition-colors"
                          >
                            Your Orders
                          </Link>
                        )}
                        <div className="border-t border-gray-100 dark:border-dark-800 my-1"></div>
                        <button 
                          onClick={onLogout} 
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                        >
                          <LogOut size={16} /> Log Out
                        </button>
                      </div>
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
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-lg p-8 relative border dark:border-dark-800 max-h-[90vh] overflow-y-auto">
                <button 
                    onClick={() => setAuthModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">
                    {authMode === 'login' ? 'Welcome Back' : 'Join EcoFeast'}
                </h2>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {/* Role Selection */}
                    {authMode === 'signup' && (
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">I am a...</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['consumer', 'retailer', 'charity', 'volunteer'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setSelectedRole(r as UserRole)}
                                        className={`py-2 px-1 text-xs sm:text-sm rounded-lg capitalize border transition-colors ${
                                            selectedRole === r 
                                            ? 'bg-eco-100 border-eco-500 text-eco-700 dark:bg-eco-900 dark:text-eco-300' 
                                            : 'border-gray-200 dark:border-dark-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Common Fields */}
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-eco-500 outline-none dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
                        <input 
                            type="password" 
                            required
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-eco-500 outline-none dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    {/* Role Specific Fields for Signup */}
                    {authMode === 'signup' && (
                        <>
                            {selectedRole === 'consumer' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
                                    <input 
                                        type="text" required
                                        className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            )}

                            {(selectedRole === 'retailer' || selectedRole === 'charity') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Organization Name</label>
                                        <input 
                                            type="text" required
                                            className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                            value={formData.orgName} onChange={e => setFormData({...formData, orgName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Address</label>
                                        <input 
                                            type="text" required
                                            className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone</label>
                                        <input 
                                            type="tel" required
                                            className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                            value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedRole === 'volunteer' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
                                        <input 
                                            type="text" required
                                            className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Vehicle Type</label>
                                        <select 
                                            className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white text-gray-900 bg-white"
                                            value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                                        >
                                            <option value="">Select...</option>
                                            <option value="bike">Bicycle</option>
                                            <option value="scooter">Scooter/Bike</option>
                                            <option value="car">Car</option>
                                            <option value="van">Van</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <button
                        disabled={authLoading}
                        className="w-full bg-eco-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-eco-700 transition disabled:opacity-70"
                    >
                        {authLoading ? 'Please wait...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}
                    </button>
                    {authError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                    )}
                </form>

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {authMode === 'login' ? "New here? " : "Already have an account? "}
                    <button 
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-eco-600 font-bold hover:underline"
                    >
                        {authMode === 'login' ? 'Create Account' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
