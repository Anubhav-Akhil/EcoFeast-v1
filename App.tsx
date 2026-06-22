import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Partners } from './pages/Partners';
import { Charities } from './pages/Charities';
import { About } from './pages/About';
import { Dashboards } from './pages/Dashboards';
import { Profile } from './pages/Profile';
import { Contact } from './pages/Contact';
import { Impact } from './pages/Impact';
import { Volunteer } from './pages/Volunteer';
import { HowItWorks } from './pages/HowItWorks';
import { api } from './services/api';
import { User, Item, UserRole } from './types';
import { X, Trash2, CheckCircle, Minus, Plus, ShoppingBag, Package, Truck, XCircle, BadgeCheck, ClipboardList } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from './services/socket';
import { useNotificationStore, buildNotification } from './services/notificationStore';
import { AlertPopup, PopupType } from './components/AlertPopup';
import { ModalHeader, ModalShell, primaryButtonClassName, secondaryButtonClassName } from './components/ui';
import { OtpVerificationModal } from './components/OtpVerificationModal';
import { AddressMapModal } from './components/AddressMapModal';

interface CartEntry {
  item: Item;
  quantity: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<UserRole>('consumer');
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'signup'>('login');

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string>('');
  const [marketplaceRefreshKey, setMarketplaceRefreshKey] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  // Verification pipeline state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressMandatory, setAddressMandatory] = useState(false);

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  const addNotification = useNotificationStore(state => state.addNotification);
  const [toastNotification, setToastNotification] = useState<Item | null>(null);
  const [orderToast, setOrderToast] = useState<any>(null);

  useEffect(() => {
    const handleNewItem = (item: Item) => {
      addNotification(buildNotification('new_item', { itemTitle: item.title, storeName: item.storeName }));
      setToastNotification(item);
      setTimeout(() => setToastNotification(null), 6000);
    };

    const handleOrderUpdated = (order: any) => {
      if (user && order.userId === user.id) {
        const notif = buildNotification('order_update', {
          status: order.status,
          storeName: order.items?.[0]?.storeName,
          orderCode: order.code,
          volunteerName: order.volunteerName,
        });
        addNotification({ ...notif, link: `/dashboard?tab=orders&orderId=${order.id}` });
        setOrderToast({ ...order, _notif: notif });
        setTimeout(() => setOrderToast(null), 7000);
      }
    };

    const handleNewOrderForStore = (payload: any) => {
      if (!user || user.role !== 'retailer') return;
      if (payload?.storeId !== user.id) return;
      const notif = buildNotification('new_order', { orderCode: payload.code, storeName: payload.storeName });
      addNotification({ ...notif, link: `/dashboard?tab=orders&orderId=${payload.orderId || payload.id}` });
    };

    const handleTaskUpdatedForStore = (task: any) => {
      if (!user || user.role !== 'retailer') return;
      if (task?.storeId !== user.id) return;
      const notif = buildNotification('task_update', { status: task.status, storeName: task.storeName, volunteerName: task.volunteerName });
      addNotification({ ...notif, link: `/dashboard?tab=pickups&orderId=${task.orderId}` });
    };

    socket.on('new-item', handleNewItem);
    socket.on('order-updated', handleOrderUpdated);
    socket.on('new-order', handleNewOrderForStore);
    socket.on('task-updated', handleTaskUpdatedForStore);

    return () => {
      socket.off('new-item', handleNewItem);
      socket.off('order-updated', handleOrderUpdated);
      socket.off('new-order', handleNewOrderForStore);
      socket.off('task-updated', handleTaskUpdatedForStore);
    };
  }, [user, addNotification]);

  useEffect(() => {
    const session = api.getSession();
    if (session) {
      setUser(session);
      api.refreshSession().then((fresh) => {
        if (fresh) setUser(fresh);
      }).catch(() => { /* session expired – logout handled inside refreshSession */ });
    }
  }, []);

  // Verification checking pipeline — for LOGGED IN users only
  // During signup, user is null and the OTP modal is managed explicitly by handleLogin
  useEffect(() => {
    if (user) {
      if (!user.emailVerified) {
        setOtpEmail(user.email);
        setShowOtpModal(true);
        setShowAddressModal(false);
      } else if (user.role !== 'admin' && (!user.address || !user.location || !user.location.lat || !user.location.lng)) {
        setAddressMandatory(true);
        setShowAddressModal(true);
        setShowOtpModal(false);
      } else {
        setShowOtpModal(false);
        setShowAddressModal(false);
        setAddressMandatory(false);
      }
    }
    // When user is null, do NOT force-close showOtpModal —
    // it may be open for a fresh signup (user hasn't verified yet)
  }, [user]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleOpenAuth = (role: UserRole = 'consumer', mode: 'login' | 'signup' = 'login') => {
    setInitialAuthRole(role);
    setInitialAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogin = async (email: string, role: UserRole, details: any, mode: 'login' | 'signup') => {
    const u = await api.login(email, role, details, mode);
    setAuthModalOpen(false);

    if (mode === 'signup') {
      // Signup: user is NOT logged in yet — just show OTP modal
      // Backend already sent the OTP email during signup
      setOtpEmail(email);
      setShowOtpModal(true);
    } else {
      // Login: user IS logged in
      setUser(u);
      // If unverified, show the OTP modal (backend already generated/sent the OTP)
      if (!u.emailVerified) {
        setOtpEmail(u.email);
        setShowOtpModal(true);
      }
      // The verification pipeline useEffect handles the rest
    }
  };

  const handleOtpVerified = (verifiedUser: User) => {
    setUser(verifiedUser);
    setShowOtpModal(false);
    // After OTP verification, check if address is needed
    if (verifiedUser.role !== 'admin' && (!verifiedUser.address || !verifiedUser.location || !verifiedUser.location.lat || !verifiedUser.location.lng)) {
      setAddressMandatory(true);
      setShowAddressModal(true);
    }
  };

  const handleAddressSaved = (updatedUser: User) => {
    setUser(updatedUser);
    setShowAddressModal(false);
    setAddressMandatory(false);
  };

  const addToCart = (item: Item, quantityToAdd: number = 1) => {
    if (!user) {
      handleOpenAuth('consumer');
      return;
    }
    // Only consumers can add to cart
    if (user.role !== 'consumer') return;

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      const safeAdd = Math.max(1, quantityToAdd);

      if (idx === -1) {
        return [...prev, { item, quantity: Math.min(safeAdd, item.quantity || safeAdd) }];
      }

      const updated = [...prev];
      const maxQty = item.quantity || updated[idx].quantity + safeAdd;
      updated[idx] = {
        ...updated[idx],
        item,
        quantity: Math.min(updated[idx].quantity + safeAdd, maxQty),
      };
      return updated;
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, nextQuantity: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.item.id !== itemId) return c;
        const maxQty = c.item.quantity || c.quantity;
        return { ...c, quantity: Math.max(1, Math.min(nextQuantity, maxQty)) };
      })
    );
  };

  const handleCheckout = async () => {
    if (!user) return;
    try {
      const expandedItems = cart.flatMap((entry) =>
        Array.from({ length: entry.quantity }, () => entry.item)
      );
      const order = await api.createOrder(user.id, expandedItems);
      setLastOrderCode(order?.code || '');
      setShowCheckoutSuccess(true);
      setCart([]);
      setIsCartOpen(false);
      setMarketplaceRefreshKey((prev) => prev + 1);
    } catch (e: any) {
      openAlert('error', 'Checkout Failed', e.message || 'Unable to place your order right now. Please try again.');
    }
  };

  return (
    <Router>
      <Layout
        user={user}
        onLogout={() => {
          api.logout();
          setUser(null);
          setCart([]);
        }}
        onOpenAuth={handleOpenAuth}
        isDark={isDark}
        toggleTheme={toggleTheme}
        authModalOpen={authModalOpen}
        setAuthModalOpen={setAuthModalOpen}
        handleLogin={handleLogin}
        initialAuthRole={initialAuthRole}
        initialAuthMode={initialAuthMode}
        cartCount={cart.reduce((sum, entry) => sum + entry.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      >
        <Routes>
          <Route
            path="/"
            element={user && user.role !== 'consumer' ? <Navigate to="/dashboard" replace /> : <Home user={user} onOpenAuth={handleOpenAuth} />}
          />

          <Route
            path="/marketplace"
            element={
              <Marketplace user={user} onAddToCart={addToCart} refreshKey={marketplaceRefreshKey} />
            }
          />

          <Route path="/partners" element={user ? <Navigate to="/dashboard" replace /> : <Partners onOpenAuth={handleOpenAuth} />} />
          <Route path="/charities" element={user ? <Navigate to="/dashboard" replace /> : <Charities onOpenAuth={handleOpenAuth} />} />
          <Route path="/volunteers" element={user ? <Navigate to="/dashboard" replace /> : <Volunteer onOpenAuth={handleOpenAuth} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/how-it-works" element={<HowItWorks onOpenAuth={handleOpenAuth} />} />
          <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={(u) => setUser(u)} /> : <Navigate to="/" replace />} />
          <Route path="/dashboard" element={user ? <Dashboards user={user} /> : <Navigate to="/" replace />} />
          <Route path="*" element={<div className="p-20 text-center dark:text-white">Page Not Found</div>} />
        </Routes>
      </Layout>

      {isCartOpen && user?.role === 'consumer' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="bg-white dark:bg-dark-900 w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto border-l dark:border-dark-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Your cart is empty.</div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {cart.map((entry) => (
                    <div key={entry.item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                      <img src={entry.item.image} className="w-16 h-16 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/custom-placeholder.png'; }} />
                      <div className="flex-1">
                        <div className="font-bold dark:text-white">{entry.item.title}</div>
                        <div className="text-eco-600 font-bold">
                          {entry.item.discountPrice === 0 ? 'FREE' : `INR ${entry.item.discountPrice}`}
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                          <button
                            onClick={() => updateCartQuantity(entry.item.id, entry.quantity - 1)}
                            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-700"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-1 text-sm font-semibold dark:text-white">{entry.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(entry.item.id, entry.quantity + 1)}
                            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-700"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(entry.item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t dark:border-dark-800 pt-4">
                  <div className="flex justify-between text-xl font-bold mb-6 dark:text-white">
                    <span>Total</span>
                    <span>INR {cart.reduce((sum, entry) => sum + entry.item.discountPrice * entry.quantity, 0)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-eco-600 text-white py-4 rounded-xl font-bold hover:bg-eco-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle /> Place Order
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ModalShell open={showCheckoutSuccess} onClose={() => setShowCheckoutSuccess(false)} maxWidthClassName="max-w-md">
        <div className="space-y-6">
          <ModalHeader
            title="Order Confirmed"
            description="Your food order was placed successfully and is now ready to track."
            icon={<CheckCircle size={24} />}
            tone="success"
            eyebrow="Checkout Complete"
            align="center"
          />
          {lastOrderCode && (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">Order Number</p>
              <p className="mt-2 font-mono text-3xl font-black tracking-[0.18em] text-emerald-700 dark:text-emerald-200">#{lastOrderCode}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">Use this in your dashboard to follow updates.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            <a
              href="/#/dashboard?tab=orders"
              onClick={() => setShowCheckoutSuccess(false)}
              className={`w-full text-center ${primaryButtonClassName}`}
            >
              Track Your Order
            </a>
            <button
              onClick={() => setShowCheckoutSuccess(false)}
              className={`w-full ${secondaryButtonClassName}`}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Toast: New Item */}
      <AnimatePresence>
        {toastNotification && (
          <ToastCard
            key={toastNotification.id}
            onDismiss={() => setToastNotification(null)}
            duration={6000}
            barColor="from-violet-500 to-teal-400"
          >
            <div className="flex gap-3.5 items-start">
              <div className="h-11 w-11 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={20} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">New Surplus</p>
                <p className="text-sm font-bold text-white leading-snug">{toastNotification.storeName}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">Just listed: {toastNotification.title}</p>
              </div>
            </div>
          </ToastCard>
        )}
      </AnimatePresence>

      {/* Toast: Order Update */}
      <AnimatePresence>
        {orderToast && (() => {
          const notif = orderToast._notif || {};
          const statusColorMap: Record<string, string> = {
            completed: 'from-emerald-500 to-teal-400',
            cancelled: 'from-rose-500 to-red-500',
            ready: 'from-violet-500 to-purple-500',
            accepted: 'from-sky-500 to-cyan-400',
            picked_up: 'from-orange-500 to-amber-400',
          };
          const barColor = statusColorMap[orderToast.status] || 'from-sky-500 to-blue-400';
          const StatusIcon = orderToast.status === 'cancelled' ? XCircle
            : orderToast.status === 'completed' ? BadgeCheck
            : orderToast.status === 'ready' || orderToast.status === 'packed' ? Package
            : Truck;
          const iconColor = orderToast.status === 'cancelled' ? 'text-rose-400'
            : orderToast.status === 'completed' ? 'text-emerald-400'
            : 'text-sky-400';
          return (
            <ToastCard
              key={orderToast.code + orderToast.status}
              onDismiss={() => setOrderToast(null)}
              duration={7000}
              barColor={barColor}
            >
              <div className="flex gap-3.5 items-start">
                <div className="h-11 w-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <StatusIcon size={20} className={iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Order #{orderToast.code}</p>
                  <p className="text-sm font-bold text-white leading-snug">{notif.title || 'Order Updated'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
              </div>
            </ToastCard>
          );
        })()}
      </AnimatePresence>

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        open={showOtpModal}
        email={otpEmail}
        onVerified={handleOtpVerified}
        onClose={() => {
          setShowOtpModal(false);
          api.logout();
          setUser(null);
        }}
      />

      {/* Address Collection Modal */}
      <AddressMapModal
        open={showAddressModal}
        onAddressSaved={handleAddressSaved}
        onClose={addressMandatory ? () => {
          setShowAddressModal(false);
          api.logout();
          setUser(null);
        } : () => setShowAddressModal(false)}
        mandatory={addressMandatory}
        initialLocation={user?.location || null}
      />
    </Router>
  );
};

// ── Reusable animated toast card with progress bar ────────────────────────────
const ToastCard: React.FC<{
  children: React.ReactNode;
  onDismiss: () => void;
  duration: number;
  barColor: string;
}> = ({ children, onDismiss, duration, barColor }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start drain animation on next frame so browser picks up the transition
    const raf = requestAnimationFrame(() => {
      if (barRef.current) barRef.current.style.width = '0%';
    });
    const timer = setTimeout(onDismiss, duration);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 64, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="fixed bottom-6 right-6 z-[100] w-80 rounded-2xl border border-white/8 bg-[#0d1117] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden"
    >
      <div className="relative p-5">
        {children}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      <div className="h-[3px] w-full bg-white/5">
        <div
          ref={barRef}
          className={`h-full w-full bg-gradient-to-r ${barColor} transition-all ease-linear`}
          style={{ transitionDuration: `${duration}ms` }}
        />
      </div>
    </motion.div>
  );
};

export default App;
