import React, { useState, useEffect } from 'react';
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
import { api } from './services/mockBackend';
import { User, Item, UserRole } from './types';
import { X, Trash2, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<UserRole>('consumer');
  
  // Cart State
  const [cart, setCart] = useState<Item[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Theme State
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const session = api.getSession();
    if (session) setUser(session);
  }, []);

  // Apply Theme
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

  const handleLogin = async (email: string, role: UserRole, details: any) => {
    const u = await api.login(email, role, details);
    setUser(u);
    setAuthModalOpen(false);
  };

  const addToCart = (item: Item) => {
      if (!user) {
          handleOpenAuth('consumer');
          return;
      }
      setCart([...cart, item]);
      setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
  };

  const handleCheckout = async () => {
      if (!user) return;
      try {
          await api.createOrder(user.id, cart);
          alert("Order Placed Successfully!");
          setCart([]);
          setIsCartOpen(false);
      } catch (e: any) {
          alert("Order failed: " + e.message);
      }
  };

  // Role based protection wrapper
  const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: UserRole[] }) => {
      if (!user) return <Navigate to="/" replace />;
      if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard if wrong role
          return <Navigate to="/dashboard" replace />;
      }
      return children;
  };

  return (
    <Router>
      <Layout 
        user={user} 
        onLogout={() => { api.logout(); setUser(null); setCart([]); }} 
        onOpenAuth={handleOpenAuth}
        isDark={isDark}
        toggleTheme={toggleTheme}
        authModalOpen={authModalOpen}
        setAuthModalOpen={setAuthModalOpen}
        handleLogin={handleLogin}
        initialAuthRole={initialAuthRole}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
      >
        <Routes>
          {/* Public Routes - if logged in as retailer/charity/volunteer, redirect to dashboard for cleanliness? */}
          {/* Or allow them to browse Home/About/Partners but Redirect Marketplace if strictly enforced */}
          
          <Route path="/" element={
              user && user.role !== 'consumer' ? <Navigate to="/dashboard" replace /> : <Home />
          } />
          
          <Route path="/marketplace" element={
              user && user.role !== 'consumer' ? <Navigate to="/dashboard" replace /> : <Marketplace user={user} onAddToCart={addToCart} />
          } />
          
          <Route path="/partners" element={<Partners onOpenAuth={handleOpenAuth} />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/impact" element={<Impact />} />
          
          <Route 
            path="/dashboard" 
            element={user ? <Dashboards user={user} /> : <Navigate to="/" replace />} 
          />
          <Route path="*" element={<div className="p-20 text-center dark:text-white">Page Not Found</div>} />
        </Routes>
      </Layout>

      {/* Cart Modal/Drawer */}
      {isCartOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
              <div className="bg-white dark:bg-dark-900 w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto border-l dark:border-dark-800">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold dark:text-white">Your Cart</h2>
                      <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                          <X size={24}/>
                      </button>
                  </div>
                  
                  {cart.length === 0 ? (
                      <div className="text-center py-20 text-gray-500">
                          Your cart is empty.
                      </div>
                  ) : (
                      <>
                        <div className="space-y-4 mb-8">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                                    <img src={item.image} className="w-16 h-16 object-cover rounded" />
                                    <div className="flex-1">
                                        <div className="font-bold dark:text-white">{item.title}</div>
                                        <div className="text-eco-600 font-bold">
                                            {item.discountPrice === 0 ? 'FREE' : `₹${item.discountPrice}`}
                                        </div>
                                    </div>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="border-t dark:border-dark-800 pt-4">
                            <div className="flex justify-between text-xl font-bold mb-6 dark:text-white">
                                <span>Total</span>
                                <span>₹{cart.reduce((a, b) => a + b.discountPrice, 0)}</span>
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
    </Router>
  );
};

export default App;