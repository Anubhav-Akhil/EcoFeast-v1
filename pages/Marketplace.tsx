import React, { useEffect, useState } from 'react';
import { Search, MapPin, Clock, Tag, Filter, AlertCircle, ShoppingCart, Info, Star } from 'lucide-react';
import { api } from '../services/api';
import { Item, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MarketplaceProps {
  user: User | null;
  onAddToCart: (item: Item, quantity?: number) => void;
  refreshKey?: number;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onAddToCart, refreshKey = 0 }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [desiredQty, setDesiredQty] = useState<Record<string, number>>({});

  const storePoints = items.reduce<Record<string, number>>((acc, item) => {
    const existing = acc[item.storeName] || 0;
    acc[item.storeName] = Math.max(existing, Number(item.storeCreditPoints || 0));
    return acc;
  }, {});

  const rankedStores = (Object.entries(storePoints) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1]);

  const storeRankMap = rankedStores.reduce<Record<string, number>>((acc, [storeName], idx) => {
    acc[storeName] = idx + 1;
    return acc;
  }, {});

  useEffect(() => {
    loadItems();
  }, [user, refreshKey]); // Reload if user/order changes to apply role-based sorting

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getItems();
      const visibleData = data.filter(item => {
        if (item.forCharity && user?.role !== 'charity') return false;
        return true;
      });

      // Sorting Logic
      const sorted = visibleData.sort((a, b) => {
        // Keep sold-out at bottom across all roles.
        if (a.quantity === 0 && b.quantity > 0) return 1;
        if (a.quantity > 0 && b.quantity === 0) return -1;

        if (user?.role === 'charity') {
          // Charities see free/cheaper items first.
          return a.discountPrice - b.discountPrice;
        }

        // Consumers are recommended by retailer charity-credit points.
        const pointDelta = (b.storeCreditPoints || 0) - (a.storeCreditPoints || 0);
        if (pointDelta !== 0) return pointDelta;
        return a.discountPrice - b.discountPrice;
      });

      setItems(sorted);
    } catch (e: any) {
      setItems([]);
      setError(e?.message || "Unable to load marketplace right now.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.storeName.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDesiredQty = (item: Item) => {
    const current = desiredQty[item.id] || 1;
    return Math.max(1, Math.min(current, Math.max(1, item.quantity)));
  };

  const setItemDesiredQty = (item: Item, next: number) => {
    const capped = Math.max(1, Math.min(next, Math.max(1, item.quantity)));
    setDesiredQty(prev => ({ ...prev, [item.id]: capped }));
  };

  const statsData = [
    { name: 'Bakery', count: items.filter(i=>i.category==='bakery').length },
    { name: 'Meals', count: items.filter(i=>i.category==='meals').length },
    { name: 'Produce', count: items.filter(i=>i.category==='produce').length },
    { name: 'Grocery', count: items.filter(i=>i.category==='grocery').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Explore Surplus Food</h1>
                 <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Rescue high-quality food from local retailers. 
                    {user?.role === 'charity' ? ' Free donations appear at the top for you.' : ' Top rated partners with high credit points appear first.'}
                 </p>
                 
                 {/* Filters */}
                 <div className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search meals, retailers..." 
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-eco-500 outline-none text-gray-900 dark:text-white"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['all', 'bakery', 'meals', 'produce', 'grocery', 'compost'].map(cat => (
                            <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                                filter === cat 
                                ? 'bg-eco-600 text-white' 
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                            }`}
                            >
                            {cat}
                            </button>
                        ))}
                    </div>
                 </div>
            </div>

            {/* Graph Section */}
            <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4">Live Availability</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            />
                            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-8">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border group flex flex-col ${
                    item.quantity === 0 ? 'bg-gray-100 dark:bg-dark-800 border-gray-200 opacity-75' : 'bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800'
                }`}
              >
                {/* Image */}
                <div 
                    className="relative h-48 overflow-hidden cursor-pointer"
                    onClick={() => item.quantity > 0 && setSelectedItem(item)}
                >
                  <img src={item.image} alt={item.title} className={`w-full h-full object-cover transition-transform duration-300 ${item.quantity > 0 ? 'group-hover:scale-105' : 'grayscale'}`} />
                  
                  {item.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-full -rotate-12 border-2 border-white shadow-xl text-lg">SOLD OUT</span>
                      </div>
                  )}

                  {item.quantity > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur text-eco-800 dark:text-eco-400 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Tag size={12} /> {item.quantity} left
                    </div>
                  )}

                  {/* Recommendation Badge based on charity-credit ranking */}
                  {storeRankMap[item.storeName] && storeRankMap[item.storeName] <= 3 && (
                    <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md" title="Recommended by charity-credit points">
                      <Star size={12} fill="black" /> Recommended
                    </div>
                  )}
                  
                  {item.forAnimalFeed && (
                      <div className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                          🐾 Animal Feed Only
                      </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                    <div className="flex flex-col items-end">
                      <span className="text-eco-600 dark:text-eco-400 font-bold text-lg">
                          {item.discountPrice === 0 ? 'FREE' : `₹${item.discountPrice}`}
                      </span>
                      {item.discountPrice > 0 && (
                        <span className="text-gray-400 text-sm line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                    <MapPin size={14} className="mr-1" />
                    <span>{item.storeName} • 0.5km</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 text-xs rounded-md">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50 dark:border-dark-800">
                    <button
                        onClick={() => item.quantity > 0 && setSelectedItem(item)}
                        disabled={item.quantity === 0}
                        className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
                    >
                        View Details
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                        <button
                          onClick={() => setItemDesiredQty(item, getDesiredQty(item) - 1)}
                          disabled={item.quantity === 0}
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="px-2 text-sm dark:text-white min-w-[28px] text-center">{getDesiredQty(item)}</span>
                        <button
                          onClick={() => setItemDesiredQty(item, getDesiredQty(item) + 1)}
                          disabled={item.quantity === 0}
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => onAddToCart(item, getDesiredQty(item))}
                        disabled={item.quantity === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                            item.quantity === 0 
                            ? 'bg-gray-300 dark:bg-dark-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-eco-600 text-white hover:bg-eco-700 dark:hover:bg-eco-500'
                        }`}
                      >
                        <ShoppingCart size={16} /> {item.discountPrice === 0 ? 'Claim' : 'Reserve'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{opacity: 0, scale: 0.9}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0, scale: 0.9}}
                    className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                >
                    <div className="relative h-64">
                         <img src={selectedItem.image} className="w-full h-full object-cover" />
                         <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                             <span className="sr-only">Close</span>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                         </button>
                    </div>
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold dark:text-white mb-2">{selectedItem.title}</h2>
                                <div className="text-eco-600 font-medium text-lg">{selectedItem.storeName}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-eco-600">
                                    {selectedItem.discountPrice === 0 ? 'FREE' : `₹${selectedItem.discountPrice}`}
                                </div>
                                <div className="text-gray-400 line-through">₹{selectedItem.originalPrice}</div>
                            </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                            {selectedItem.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup Time</div>
                                <div className="dark:text-white flex items-center gap-2">
                                    <Clock size={16}/> {selectedItem.pickupStart} - {selectedItem.pickupEnd} Today
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Category</div>
                                <div className="dark:text-white capitalize">{selectedItem.category}</div>
                            </div>
                        </div>

                        {selectedItem.forAnimalFeed && (
                            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-4 rounded-lg mb-6 flex gap-3">
                                <Info className="shrink-0" />
                                <div className="text-sm">
                                    <strong>Note:</strong> This item is designated for animal feed or composting only. Not fit for human consumption.
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 items-center">
                            <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                                <button
                                    onClick={() => setItemDesiredQty(selectedItem, getDesiredQty(selectedItem) - 1)}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                    -
                                </button>
                                <span className="px-3 font-semibold dark:text-white">{getDesiredQty(selectedItem)}</span>
                                <button
                                    onClick={() => setItemDesiredQty(selectedItem, getDesiredQty(selectedItem) + 1)}
                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                onClick={() => { onAddToCart(selectedItem, getDesiredQty(selectedItem)); setSelectedItem(null); }}
                                className="flex-1 bg-eco-600 text-white py-3 rounded-xl font-bold hover:bg-eco-700 transition"
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
          )}
      </AnimatePresence>
    </div>
  );
};
