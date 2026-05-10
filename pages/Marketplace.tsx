import React, { useEffect, useState } from 'react';
import { Search, MapPin, Clock, Tag, Filter, ShoppingCart, Info, Star, Flame, Leaf, X, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { Item, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ModalShell, primaryButtonClassName } from '../components/ui';

interface MarketplaceProps {
  user: User | null;
  onAddToCart: (item: Item, quantity?: number) => void;
  refreshKey?: number;
}

const CATEGORIES = ['all', 'bakery', 'meals', 'produce', 'grocery', 'compost'] as const;

const catEmoji: Record<string, string> = {
  all: '🛒', bakery: '🥖', meals: '🍱', produce: '🥦', grocery: '🛍️', compost: '♻️',
};

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onAddToCart, refreshKey = 0 }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [desiredQty, setDesiredQty] = useState<Record<string, number>>({});
  const [showStats, setShowStats] = useState(false);

  const storePoints = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.storeName] = Math.max(acc[item.storeName] || 0, Number(item.storeCreditPoints || 0));
    return acc;
  }, {});

  const storeRankMap = (Object.entries(storePoints) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .reduce<Record<string, number>>((acc, [name], idx) => { acc[name] = idx + 1; return acc; }, {});

  useEffect(() => { loadItems(); }, [user, refreshKey]);

  const loadItems = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.getItems();
      const visible = data.filter(item => !(item.forCharity && user?.role !== 'charity' && user?.role !== 'retailer'));
      setItems(visible.sort((a, b) => {
        if (a.quantity === 0 && b.quantity > 0) return 1;
        if (a.quantity > 0 && b.quantity === 0) return -1;
        if (user?.role === 'charity') return a.discountPrice - b.discountPrice;
        const pd = (b.storeCreditPoints || 0) - (a.storeCreditPoints || 0);
        return pd !== 0 ? pd : a.discountPrice - b.discountPrice;
      }));
    } catch (e: any) { setItems([]); setError(e?.message || 'Unable to load marketplace.'); }
    finally { setLoading(false); }
  };

  const filtered = items.filter(item => {
    const matchCat = filter === 'all' || item.category === filter;
    const q = search.toLowerCase();
    return matchCat && (item.title.toLowerCase().includes(q) || item.storeName.toLowerCase().includes(q));
  });

  const getQty = (item: Item) => Math.max(1, Math.min(desiredQty[item.id] || 1, Math.max(1, item.quantity)));
  const setQty = (item: Item, n: number) => setDesiredQty(p => ({ ...p, [item.id]: Math.max(1, Math.min(n, Math.max(1, item.quantity))) }));

  const statsData = CATEGORIES.slice(1).map(c => ({ name: c.charAt(0).toUpperCase() + c.slice(1), count: items.filter(i => i.category === c).length }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020917] transition-colors">

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(16,185,129,0.2) 0%, #020917 60%)' }}>
        <div className="dot-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400 mb-3">Live Marketplace</p>
              <h1 className="text-4xl font-black text-white md:text-5xl">
                {user?.role === 'charity' ? 'Claim donations near you.' : 'Surplus food. Real savings.'}
              </h1>
              <p className="mt-3 text-slate-400 max-w-xl">
                {user?.role === 'charity'
                  ? 'Free donations appear first. Browse and claim what your community needs.'
                  : user?.role === 'retailer'
                    ? 'You\'re in view-only mode. Browse what others are offering.'
                    : 'Top-rated partner stores appear first. Every item rescued keeps food out of landfills.'}
              </p>
            </div>
            <button
              onClick={() => setShowStats(v => !v)}
              className="inline-flex items-center gap-2 self-start md:self-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              <Filter size={16} /> Live Stats {showStats ? <X size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Retailer banner */}
          {user?.role === 'retailer' && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-amber-200 text-sm font-medium">
              <Info size={18} className="text-amber-400 shrink-0" />
              View-only mode. Log in as a Customer to purchase, or as a Charity to claim donations.
            </div>
          )}

          {/* Stats bar */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-6"
              >
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Items available by category</p>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── STICKY FILTER BAR ── */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#020917]/95 backdrop-blur border-b border-slate-200 dark:border-white/5 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search food, store..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 w-full sm:w-auto flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  filter === cat
                    ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{catEmoji[cat]}</span>
                <span className="capitalize">{cat}</span>
              </button>
            ))}
          </div>
          <div className="text-xs font-bold text-slate-400 whitespace-nowrap">
            {filtered.length} items
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse h-80" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl font-black text-slate-950 dark:text-white">No items found</p>
            <p className="text-slate-500 mt-2">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.4 }}
                className={`group rounded-3xl overflow-hidden border flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${
                  item.quantity === 0
                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                }`}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => item.quantity > 0 && setSelectedItem(item)}>
                  <img src={item.image} alt={item.title} className={`w-full h-full object-cover transition-transform duration-500 ${item.quantity > 0 ? 'group-hover:scale-105' : 'grayscale'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />

                  {item.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-black px-5 py-2 rounded-full -rotate-12 border-2 border-white shadow-xl">SOLD OUT</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {storeRankMap[item.storeName] <= 3 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-slate-950">
                        <Star size={11} fill="currentColor" /> Top Pick
                      </span>
                    )}
                    {item.forCharity && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-black text-white">
                        <Leaf size={11} /> Donation
                      </span>
                    )}
                    {item.forAnimalFeed && (
                      <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-black text-white">🐾 Animal</span>
                    )}
                  </div>

                  {item.quantity > 0 && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-xs font-bold text-white">
                      <Tag size={11} /> {item.quantity} left
                    </span>
                  )}

                  {item.quantity > 0 && item.quantity <= 3 && (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-black text-white animate-pulse">
                      <Flame size={11} /> Almost gone
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-black text-slate-950 dark:text-white leading-snug">{item.title}</h3>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {item.discountPrice === 0 ? 'FREE' : `₹${item.discountPrice}`}
                      </div>
                      {item.discountPrice > 0 && (
                        <div className="text-xs text-slate-400 line-through">₹{item.originalPrice}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-3">
                    <MapPin size={12} className="mr-1 shrink-0" />
                    <span>{item.storeName} • <Clock size={11} className="inline" /> {item.pickupStart}–{item.pickupEnd}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium capitalize">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button onClick={() => item.quantity > 0 && setSelectedItem(item)} disabled={item.quantity === 0} className="text-xs font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-2 transition">
                      Details
                    </button>
                    {user?.role === 'retailer' ? (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl">View Only</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <button onClick={() => setQty(item, getQty(item) - 1)} disabled={item.quantity === 0} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-40 text-lg">−</button>
                          <span className="w-8 text-center text-sm font-bold dark:text-white">{getQty(item)}</span>
                          <button onClick={() => setQty(item, getQty(item) + 1)} disabled={item.quantity === 0} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold disabled:opacity-40 text-lg">+</button>
                        </div>
                        <button
                          onClick={() => onAddToCart(item, getQty(item))}
                          disabled={item.quantity === 0}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={14} />
                          {item.discountPrice === 0 ? 'Claim' : 'Add'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── ITEM MODAL ── */}
      <ModalShell open={!!selectedItem} onClose={() => setSelectedItem(null)} maxWidthClassName="max-w-2xl" panelClassName="overflow-hidden" contentClassName="p-0">
        {selectedItem && (
          <div>
            <div className="relative h-64 sm:h-72">
              <img src={selectedItem.image} className="h-full w-full object-cover" alt={selectedItem.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/60 mb-1">Listing Details</p>
                    <h2 className="text-3xl font-black text-white">{selectedItem.title}</h2>
                    <p className="text-sm font-semibold text-emerald-300 mt-1">{selectedItem.storeName}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur px-5 py-3 text-right border border-white/10">
                    <div className="text-3xl font-black text-white">{selectedItem.discountPrice === 0 ? 'FREE' : `₹${selectedItem.discountPrice}`}</div>
                    {selectedItem.discountPrice > 0 && <div className="text-sm text-white/50 line-through">₹{selectedItem.originalPrice}</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{selectedItem.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Pickup Window</div>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                    <Clock size={15} className="text-emerald-500" /> {selectedItem.pickupStart} – {selectedItem.pickupEnd}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Category</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white capitalize">{catEmoji[selectedItem.category]} {selectedItem.category}</div>
                </div>
              </div>

              {selectedItem.forAnimalFeed && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
                  <div className="flex gap-3 text-orange-800 dark:text-orange-200">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm leading-6"><strong>Animal-feed only:</strong> Not fit for human consumption. For animal feed or composting purposes.</p>
                  </div>
                </div>
              )}

              {user?.role === 'retailer' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                  You're browsing in retailer view-only mode.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setQty(selectedItem, getQty(selectedItem) - 1)} className="px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-bold text-lg">−</button>
                    <span className="w-14 text-center text-sm font-black text-slate-900 dark:text-white">{getQty(selectedItem)}</span>
                    <button onClick={() => setQty(selectedItem, getQty(selectedItem) + 1)} className="px-4 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-bold text-lg">+</button>
                  </div>
                  <button
                    onClick={() => { onAddToCart(selectedItem, getQty(selectedItem)); setSelectedItem(null); }}
                    className={`flex-1 ${primaryButtonClassName}`}
                  >
                    {selectedItem.discountPrice === 0 ? 'Claim Item' : 'Add to Cart'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
};
