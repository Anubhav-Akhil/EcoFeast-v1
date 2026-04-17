import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Partners } from './pages/Partners';
import { Charities } from './pages/Charities';
import { About } from './pages/About';
import { Dashboards } from './pages/Dashboards';
import { Contact } from './pages/Contact';
import { Impact } from './pages/Impact';
import { api } from './services/api';
import { User, Item, UserRole } from './types';
import { X, Trash2, CheckCircle, Minus, Plus, Bell, Truck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { socket } from './services/socket';
import { useNotificationStore } from './services/notificationStore';

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
      addNotification({
        type: 'new_item',
        title: 'New Surplus Food!',
        message: `${item.storeName} just added ${item.title}.`,
      });
      
      setToastNotification(item);
      setTimeout(() => setToastNotification(null), 5000);
    };

    const handleOrderUpdated = (order: any) => {
      if (user && order.userId === user.id) {
        const msg = `Your order #${order.code} is now ${order.status.toUpperCase()}.`;
        
        addNotification({
          type: 'order_update',
          title: 'Order Status Updated',
          message: msg,
        });

        setOrderToast(order);
        setTimeout(() => setOrderToast(null), 6000);
      }
    };

    socket.on('new-item', handleNewItem);
    socket.on('order-updated', handleOrderUpdated);

    return () => {
      socket.off('new-item', handleNewItem);
      socket.off('order-updated', handleOrderUpdated);
    };
  }, [user, addNotification]);

  useEffect(() => {
    const session = api.getSession();
    if (session) {
      setUser(session);
      api.refreshSession().then((fresh) => {
        if (fresh) setUser(fresh);
      });
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
      alert('Order failed: ' + e.message);
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
              user && user.role !== 'consumer' ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Marketplace user={user} onAddToCart={addToCart} refreshKey={marketplaceRefreshKey} />
              )
            }
          />

          <Route path="/partners" element={<Partners onOpenAuth={handleOpenAuth} />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impact" element={<Impact />} />
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

      <AnimatePresence>
        {showCheckoutSuccess && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border dark:border-dark-800"
            >
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-2">Order Confirmed! 🎉</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">Your food order was placed successfully.</p>
              {lastOrderCode && (
                <div className="bg-eco-50 dark:bg-eco-900/30 border border-eco-200 dark:border-eco-800 rounded-xl px-4 py-3 mb-6">
                  <p className="text-xs text-eco-600 dark:text-eco-400 font-semibold uppercase tracking-wide mb-1">Your Order Number</p>
                  <p className="text-2xl font-bold text-eco-700 dark:text-eco-300 font-mono tracking-wider">#{lastOrderCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Save this to track your order</p>
                </div>
              )}
              <a
                href="/#/dashboard?tab=orders"
                onClick={() => setShowCheckoutSuccess(false)}
                className="block w-full bg-eco-600 text-white py-3 rounded-xl font-bold hover:bg-eco-700 mb-2 text-center"
              >
                Track Your Order
              </a>
              <button
                onClick={() => setShowCheckoutSuccess(false)}
                className="w-full text-gray-500 py-2 text-sm hover:text-gray-700 dark:hover:text-gray-300"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Socket.IO Toast Notification */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-[100] bg-white dark:bg-dark-900 border border-eco-200 dark:border-eco-900/50 shadow-2xl rounded-2xl p-4 max-w-sm flex gap-4 cursor-pointer hover:shadow-eco-500/20 transition-shadow"
            onClick={() => setToastNotification(null)}
          >
            <div className="h-12 w-12 rounded-full bg-eco-100 dark:bg-eco-900/50 flex-shrink-0 flex items-center justify-center text-eco-600 dark:text-eco-400">
              <Bell size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">New Surplus Food!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {toastNotification.storeName} just added <span className="font-bold text-eco-600 dark:text-eco-400">{toastNotification.title}</span>.
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setToastNotification(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Socket.IO Order Update Toast */}
      <AnimatePresence>
        {orderToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-[100] bg-white dark:bg-dark-900 border border-blue-200 dark:border-blue-900/50 shadow-2xl rounded-2xl p-4 max-w-sm flex gap-4 cursor-pointer hover:shadow-blue-500/20 transition-shadow"
            onClick={() => setOrderToast(null)}
          >
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                {orderToast.status === 'completed' ? 'Order Delivered!' : 'Order On The Way!'}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Your order <span className="font-bold">#{orderToast.code}</span> has been marked as <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{orderToast.status}</span>.
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setOrderToast(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Router>
  );
};

export default App;

