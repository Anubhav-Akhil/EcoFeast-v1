import React, { useEffect, useState } from 'react';
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
import { api } from './services/api';
import { User, Item, UserRole } from './types';
import { X, Trash2, CheckCircle, Minus, Plus, Bell, Truck, XCircle, BadgeCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from './services/socket';
import { useNotificationStore, buildNotification } from './services/notificationStore';
import { AlertPopup, PopupType } from './components/AlertPopup';
import { ModalHeader, ModalShell, primaryButtonClassName, secondaryButtonClassName } from './components/ui';

interface CartEntry {
  item: Item;
  quantity: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<UserRole>('consumer');

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string>('');
  const [marketplaceRefreshKey, setMarketplaceRefreshKey] = useState(0);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

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
        addNotification({ ...notif, link: '/dashboard?tab=orders' });
        setOrderToast({ ...order, _notif: notif });
        setTimeout(() => setOrderToast(null), 7000);
      }
    };

    const handleNewOrderForStore = (payload: any) => {
      if (!user || user.role !== 'retailer') return;
      if (payload?.storeId !== user.id) return;
      const notif = buildNotification('new_order', { orderCode: payload.code, storeName: payload.storeName });
      addNotification({ ...notif, link: '/dashboard?tab=orders' });
    };

    const handleTaskUpdatedForStore = (task: any) => {
      if (!user || user.role !== 'retailer') return;
      if (task?.storeId !== user.id) return;
      const notif = buildNotification('task_update', { status: task.status, storeName: task.storeName, volunteerName: task.volunteerName });
      addNotification({ ...notif, link: '/dashboard?tab=pickups' });
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

  const handleOpenAuth = (role: UserRole = 'consumer') => {
    setInitialAuthRole(role);
    setAuthModalOpen(true);
  };

  const handleLogin = async (email: string, role: UserRole, details: any, mode: 'login' | 'signup') => {
    const u = await api.login(email, role, details, mode);
    setUser(u);
    setAuthModalOpen(false);
  };

  const addToCart = (item: Item, quantityToAdd: number = 1) => {
    if (!user) {
      handleOpenAuth('consumer');
      return;
    }

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
        cartCount={cart.reduce((sum, entry) => sum + entry.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
      >
        <Routes>
          <Route
            path="/"
            element={user && user.role !== 'consumer' ? <Navigate to="/dashboard" replace /> : <Home />}
          />

          <Route
            path="/marketplace"
            element={
              <Marketplace user={user} onAddToCart={addToCart} refreshKey={marketplaceRefreshKey} />
            }
          />

          <Route path="/partners" element={<Partners onOpenAuth={handleOpenAuth} />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={(u) => setUser(u)} /> : <Navigate to="/" replace />} />
          <Route path="/dashboard" element={user ? <Dashboards user={user} /> : <Navigate to="/" replace />} />
          <Route path="*" element={<div className="p-20 text-center dark:text-white">Page Not Found</div>} />
        </Routes>
      </Layout>

      {isCartOpen && (
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
                      <img src={entry.item.image} className="w-16 h-16 object-cover rounded" />
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
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-[100] w-[22rem] rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 cursor-pointer"
            onClick={() => setToastNotification(null)}
          >
            <div className="flex gap-3.5 items-start">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-violet-400 mb-0.5">New Surplus</p>
                <p className="text-sm font-black text-white leading-snug">{toastNotification.storeName} just dropped new food!</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{toastNotification.title} is now live on the marketplace</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setToastNotification(null); }} className="text-slate-500 hover:text-white mt-0.5"><X size={15} /></button>
            </div>
            <div className="mt-3 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ width: '100%' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast: Order Update */}
      <AnimatePresence>
        {orderToast && (() => {
          const notif = orderToast._notif || {};
          const statusColorMap: Record<string, string> = {
            completed: 'from-emerald-500 to-teal-500',
            cancelled: 'from-rose-500 to-red-600',
            ready: 'from-violet-500 to-purple-600',
            accepted: 'from-sky-500 to-cyan-500',
            picked_up: 'from-orange-500 to-amber-500',
          };
          const grad = statusColorMap[orderToast.status] || 'from-sky-500 to-blue-600';
          return (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed bottom-6 right-6 z-[100] w-[22rem] rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 cursor-pointer"
              onClick={() => setOrderToast(null)}
            >
              <div className="flex gap-3.5 items-start">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {notif.emoji || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-0.5">Order #{orderToast.code}</p>
                  <p className="text-sm font-black text-white leading-snug">{notif.title || 'Order Updated'}</p>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                  {notif.subtitle && <p className="text-[11px] font-bold text-emerald-400 mt-1">{notif.subtitle}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); setOrderToast(null); }} className="text-slate-500 hover:text-white mt-0.5"><X size={15} /></button>
              </div>
              <div className={`mt-3 h-0.5 rounded-full bg-gradient-to-r ${grad}`} />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
    </Router>
  );
};

export default App;
