import React, { useEffect, useState } from 'react';
import { User, Item, Reservation, Task } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { predictExpiryAndTags } from '../services/geminiService';
import { useSearchParams } from 'react-router-dom';
import { Plus, Package, Calendar, Camera, Leaf, Trash2, CheckSquare, Square, Truck, Upload, Search, PackagePlus, Layers3, TrendingUp, Sparkles, BadgeIndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { SuccessPopup } from '../components/SuccessPopup';

interface DashboardProps {
  user: User;
}

const RetailerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Success');
  const [successMessage, setSuccessMessage] = useState('Action completed.');
  const [listingFilter, setListingFilter] = useState<'all' | 'customer' | 'charity' | 'animal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [restockLoading, setRestockLoading] = useState(false);
  const [priceTarget, setPriceTarget] = useState<Item | null>(null);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceForm, setPriceForm] = useState({ originalPrice: 0, discountPrice: 0 });

  const [newItem, setNewItem] = useState<Partial<Item>>({
    title: '',
    description: '',
    originalPrice: 0,
    discountPrice: 0,
    category: 'meals',
    quantity: 1,
    tags: [],
    forAnimalFeed: false,
    forCharity: false,
    image: '',
  });

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    const all = await api.getItems();
    setItems(all.filter(i => i.storeName === user.organizationName || i.storeId === user.id));
  };

  const openSuccess = (title: string, message: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setSuccessOpen(true);
  };

  const getItemType = (item: Item): 'customer' | 'charity' | 'animal' => {
    if (item.forAnimalFeed) return 'animal';
    if (item.forCharity) return 'charity';
    return 'customer';
  };

  const filteredItems = items.filter((item) => {
    const type = getItemType(item);
    const matchFilter = listingFilter === 'all' || listingFilter === type;
    const q = searchTerm.trim().toLowerCase();
    const matchSearch = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const soldQuantity = items.reduce((sum, item) => sum + Number(item.rescuedCount || 0), 0);
  const charityCount = items.filter((item) => !!item.forCharity).length;
  const lowStockItems = items.filter((item) => item.quantity > 0 && item.quantity <= 2);
  const charityPointsEarned = items.reduce((sum, item) => sum + Number(item.charityClaimCount || 0) * 5, 0);

  const handleAiAnalysis = async () => {
    if (!newItem.title) return;
    setAiLoading(true);
    const result = await predictExpiryAndTags(newItem.title, newItem.category || 'grocery');
    setNewItem((prev) => ({ ...prev, tags: result.tags, expiry: new Date(Date.now() + result.expiryHours * 3600000).toISOString() }));
    setAiLoading(false);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : '';
      setNewItem((prev) => ({ ...prev, image: imageDataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.description) return;
    setSubmitting(true);
    try {
      await api.addItem({
        ...newItem,
        storeId: user.id,
        storeName: user.organizationName || 'My Store',
        pickupStart: '10:00',
        pickupEnd: '20:00',
        expiry: newItem.expiry || new Date(Date.now() + 86400000).toISOString(),
        image: newItem.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
        category: newItem.forAnimalFeed ? 'compost' : (newItem.category || 'grocery'),
        discountPrice: newItem.forCharity ? 0 : Number(newItem.discountPrice || 0),
        forCharity: !!newItem.forCharity,
      } as any);
      setShowAdd(false);
      setNewItem({ title: '', description: '', originalPrice: 0, discountPrice: 0, category: 'meals', quantity: 1, tags: [], forAnimalFeed: false, forCharity: false, image: '' });
      await loadStoreData();
      openSuccess('Listing Created', 'Surplus item has been added successfully.');
    } catch (error: any) {
      alert(error?.message || 'Failed to add surplus item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this listing?')) {
      await api.deleteItem(id);
      await loadStoreData();
    }
  };

  const handleQuickRestock = async (item: Item, qty: number) => {
    await api.updateItem(item.id, { quantityDelta: qty });
    await loadStoreData();
    openSuccess('Stock Updated', `${qty} item${qty > 1 ? 's' : ''} added to "${item.title}".`);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty < 1) return;
    setRestockLoading(true);
    try {
      await api.updateItem(restockTarget.id, { quantityDelta: restockQty });
      const targetTitle = restockTarget.title;
      setRestockTarget(null);
      setRestockQty(1);
      await loadStoreData();
      openSuccess('Stock Updated', `${restockQty} item${restockQty > 1 ? 's' : ''} added to "${targetTitle}".`);
    } finally {
      setRestockLoading(false);
    }
  };

  const openPriceEditor = (item: Item) => {
    setPriceTarget(item);
    setPriceForm({
      originalPrice: Number(item.originalPrice || 0),
      discountPrice: Number(item.discountPrice || 0),
    });
  };

  const handlePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceTarget) return;
    setPriceSaving(true);
    try {
      await api.updateItem(priceTarget.id, {
        originalPrice: Number(priceForm.originalPrice || 0),
        discountPrice: priceTarget.forCharity ? 0 : Number(priceForm.discountPrice || 0),
      });
      await loadStoreData();
      setPriceTarget(null);
      openSuccess('Price Updated', `Price updated for "${priceTarget.title}".`);
    } finally {
      setPriceSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Retailer Command Center</h2>
          <p className="text-gray-500 dark:text-gray-400">Control all your listings for customers, charities, and animal-use in one dashboard.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-eco-600 text-white px-4 py-2 rounded-lg hover:bg-eco-700 shadow-sm">
          <Plus size={18} /> Add Surplus
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200">
          <div className="text-sm font-semibold">Total Listings</div>
          <div className="text-3xl font-black mt-1">{items.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 border border-blue-200">
          <div className="text-sm font-semibold">Live Units</div>
          <div className="text-3xl font-black mt-1">{totalUnits}</div>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200">
          <div className="text-sm font-semibold">Charity Listings</div>
          <div className="text-3xl font-black mt-1">{charityCount}</div>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-800 border border-rose-200">
          <div className="text-sm font-semibold">Sold Quantity</div>
          <div className="text-3xl font-black mt-1">{soldQuantity}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Listings', icon: Layers3 },
                { key: 'customer', label: 'Customer', icon: Package },
                { key: 'charity', label: 'Charity', icon: Sparkles },
                { key: 'animal', label: 'Animal Use', icon: Leaf },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setListingFilter(tab.key as any)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
                    listingFilter === tab.key
                      ? 'bg-eco-600 text-white'
                      : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your listings..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 border dark:border-dark-700 rounded-xl bg-white dark:bg-dark-900">
                <div className="flex gap-4">
                  <img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="font-bold dark:text-white">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.quantity} left • Pickup till {item.pickupEnd}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.forAnimalFeed && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Animal Feed</span>}
                      {item.forCharity && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Charity Item</span>}
                      {!item.forAnimalFeed && !item.forCharity && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Customer Listing</span>}
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <div className="text-lg font-bold text-eco-600">{item.discountPrice === 0 ? 'FREE' : `INR ${item.discountPrice}`}</div>
                    <div className="text-xs text-gray-400 line-through">{item.discountPrice > 0 ? `INR ${item.originalPrice}` : ''}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.quantity === 0 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Sold Out</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                  )}
                  <button onClick={() => handleQuickRestock(item, 1)} className="px-3 py-1.5 text-xs rounded-lg bg-eco-100 text-eco-700 font-semibold hover:bg-eco-200">+1 Stock</button>
                  <button onClick={() => handleQuickRestock(item, 5)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200">+5 Stock</button>
                  <button onClick={() => setRestockTarget(item)} className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 flex items-center gap-1">
                    <PackagePlus size={14} /> Custom Add
                  </button>
                  <button onClick={() => openPriceEditor(item)} className="px-3 py-1.5 text-xs rounded-lg bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 flex items-center gap-1">
                    <BadgeIndianRupee size={14} /> Change Price
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded" title="Delete Item">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <div className="text-gray-500 text-center py-8">No listings match this view.</div>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
            <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><TrendingUp size={18} /> Weekly Impact</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'M', value: 10 }, { name: 'T', value: 25 }, { name: 'W', value: 15 }, { name: 'T', value: 30 }, { name: 'F', value: 45 }, { name: 'S', value: 20 }]}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
              Marking items for charity builds social trust and impact.
            </div>
          </div>

          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
            <h3 className="font-bold mb-2 dark:text-white">Charity Points Gained</h3>
            <div className="text-4xl font-black text-purple-700 dark:text-purple-300">{charityPointsEarned}</div>
            <p className="text-xs text-gray-500 mt-2">
              You earn 5 points for each charity-marked unit successfully claimed by a charity.
            </p>
          </div>

          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
            <h3 className="font-bold mb-2 dark:text-white">Low Stock Alerts</h3>
            <div className="text-4xl font-black text-orange-700 dark:text-orange-300">{lowStockItems.length}</div>
            <p className="text-xs text-gray-500 mt-2">
              Listings currently at 2 or fewer units. Use stock controls to restock quickly.
            </p>
            <div className="mt-3 space-y-1">
              {lowStockItems.length === 0 ? (
                <p className="text-xs text-gray-400">No low-stock items right now.</p>
              ) : (
                lowStockItems.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRestockTarget(item)}
                    className="block w-full text-left text-xs rounded-md px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800"
                  >
                    {item.title}: {item.quantity}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {restockTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-dark-700">
            <h4 className="text-xl font-bold dark:text-white mb-2">Add Stock</h4>
            <p className="text-sm text-gray-500 mb-4">Listing: <span className="font-semibold">{restockTarget.title}</span></p>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" />
              <div className="grid grid-cols-2 gap-3">
                <button disabled={restockLoading} type="submit" className="bg-eco-600 text-white py-2 rounded-lg font-semibold hover:bg-eco-700 disabled:opacity-70">{restockLoading ? 'Adding...' : 'Add Items'}</button>
                <button type="button" onClick={() => setRestockTarget(null)} className="bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 p-8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 dark:text-white">List New Surplus</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Item Name</label>
                <div className="flex gap-2">
                  <input
                    required
                    className="flex-1 border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="e.g. Assorted Bagels"
                  />
                  <button type="button" onClick={handleAiAnalysis} disabled={aiLoading || !newItem.title} className="bg-eco-100 text-eco-700 p-2 rounded hover:bg-eco-200" title="Auto-fill with AI">
                    {aiLoading ? '...' : <Camera size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe item quality and quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Item Image (Optional)</label>
                <div className="border border-dashed border-gray-300 dark:border-dark-700 rounded-lg p-3">
                  <label className="flex items-center justify-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-300">
                    <Upload size={16} /> Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                  </label>
                </div>
                {newItem.image && <img src={newItem.image} className="mt-3 h-28 w-full object-cover rounded-lg" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                  <select
                    className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as Item['category'] })}
                  >
                    <option value="meals">Meals</option>
                    <option value="bakery">Bakery</option>
                    <option value="produce">Produce</option>
                    <option value="grocery">Grocery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white"
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({ ...newItem, quantity: +e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Original Price (INR)</label>
                  <input type="number" className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" value={newItem.originalPrice || 0} onChange={(e) => setNewItem({ ...newItem, originalPrice: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Discount Price (INR)</label>
                  <input type="number" className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" value={newItem.discountPrice || 0} onChange={(e) => setNewItem({ ...newItem, discountPrice: +e.target.value })} disabled={!!newItem.forCharity} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer border border-orange-100 dark:border-orange-800" onClick={() => setNewItem({ ...newItem, forAnimalFeed: !newItem.forAnimalFeed })}>
                  <div className={`mt-0.5 ${newItem.forAnimalFeed ? 'text-orange-600' : 'text-gray-400'}`}>
                    {newItem.forAnimalFeed ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Animal Feed / Compost</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Mark for non-human use.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer border border-green-100 dark:border-green-800" onClick={() => setNewItem({ ...newItem, forCharity: !newItem.forCharity })}>
                  <div className={`mt-0.5 ${newItem.forCharity ? 'text-green-600' : 'text-gray-400'}`}>
                    {newItem.forCharity ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Mark for Charity</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">This will appear in the charity dashboard.</span>
                  </div>
                </div>
              </div>

              <button disabled={submitting} type="submit" className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold hover:bg-eco-700 disabled:opacity-70">
                {submitting ? 'Adding...' : 'Add Surplus Item'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="w-full text-gray-500 py-2 hover:text-gray-700">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {priceTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-dark-700">
            <h4 className="text-xl font-bold dark:text-white mb-2">Change Price</h4>
            <p className="text-sm text-gray-500 mb-4">
              Listing: <span className="font-semibold">{priceTarget.title}</span>
            </p>
            <form onSubmit={handlePriceUpdate} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 dark:text-gray-300">Original Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={priceForm.originalPrice}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 dark:text-gray-300">Discount Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  disabled={!!priceTarget.forCharity}
                  value={priceTarget.forCharity ? 0 : priceForm.discountPrice}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, discountPrice: Number(e.target.value) }))}
                  className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white disabled:opacity-60"
                />
                {priceTarget.forCharity && (
                  <p className="text-xs text-green-600 mt-1">Charity listings are always free.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={priceSaving}
                  type="submit"
                  className="bg-eco-600 text-white py-2 rounded-lg font-semibold hover:bg-eco-700 disabled:opacity-70"
                >
                  {priceSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setPriceTarget(null)}
                  className="bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SuccessPopup open={successOpen} title={successTitle} message={successMessage} onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

// Orders accordion component - tracks which order is expanded
const OrdersAccordion: React.FC<{ reservations: Reservation[] }> = ({ reservations }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center mb-4">
          <Package size={36} className="text-gray-400" />
        </div>
        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-1">No orders yet</h3>
        <p className="text-sm text-gray-400">Your order history will appear here.</p>
        <a href="/#/marketplace" className="mt-5 bg-eco-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-eco-700 transition-colors">
          Browse Marketplace
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((res) => {
        const isExpanded = expandedId === res.id;
        const statusStep = res.status === 'completed' ? 3 : res.status === 'accepted' ? 2 : 1;
        const statusConfig: Record<string, { label: string; badge: string; bar: string }> = {
          pending:   { label: 'Order Received', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-400' },
          accepted:  { label: 'On The Way',      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',    bar: 'bg-blue-500'  },
          completed: { label: 'Delivered',       badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', bar: 'bg-green-500' },
        };
        const sc = statusConfig[res.status] || { label: res.status, badge: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' };

        const storeGroups = (res.items || []).reduce((acc: any, item: any) => {
          const key = item.storeName || 'Unknown Store';
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});

        const orderDate = res.timestamp ? new Date(res.timestamp) : null;
        const dateStr = orderDate ? orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const timeStr = orderDate ? orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

        const steps = [
          { label: 'Order Received',    desc: 'Your order was placed successfully.', done: statusStep >= 1 },
          { label: 'Partner Picked Up', desc: 'A volunteer is on the way.',           done: statusStep >= 2 },
          { label: 'Delivered',         desc: 'Enjoy your rescued food!',             done: statusStep >= 3 },
        ];

        return (
          <div key={res.id} className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : res.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-10 w-1 rounded-full flex-shrink-0 ${sc.bar}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-gray-900 dark:text-white text-base">#{res.code}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${sc.badge}`}>{sc.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{dateStr} · {timeStr} &nbsp;·&nbsp; {res.items?.length || 0} item(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <span className="font-black text-eco-600 dark:text-eco-400">INR {res.totalAmount || 0}</span>
                <span className={`text-gray-400 text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-dark-800">
                <div className="px-5 pt-4 pb-3 space-y-4">
                  {Object.entries(storeGroups).map(([storeName, storeItems]: [string, any]) => (
                    <div key={storeName}>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">📍 {storeName}</p>
                      <div className="space-y-2">
                        {storeItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-dark-800 rounded-xl p-3">
                            <img src={item.image} alt={item.title} className="h-11 w-11 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.title}</p>
                              <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                            </div>
                            <p className="text-sm font-bold text-eco-600 dark:text-eco-400 flex-shrink-0">
                              {item.discountPrice === 0 ? 'FREE' : `₹${item.discountPrice}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-5 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Delivery Timeline</p>
                  <div className="relative pl-7">
                    <div className="absolute left-2 top-1.5 bottom-1.5 w-0.5 bg-gray-200 dark:bg-dark-700 rounded-full" />
                    {steps.map((step, i) => (
                      <div key={i} className={`relative flex items-start gap-3 ${i < steps.length - 1 ? 'pb-5' : ''}`}>
                        <div className={`absolute -left-5 mt-1 h-3 w-3 rounded-full border-2 z-10 ${
                          step.done
                            ? `${sc.bar} border-white dark:border-dark-900`
                            : 'bg-gray-200 dark:bg-dark-700 border-white dark:border-dark-900'
                        }`} />
                        <div>
                          <p className={`text-sm font-bold leading-tight ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{step.label}</p>
                          <p className={`text-xs mt-0.5 ${step.done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-700'}`}>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ConsumerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') === 'orders' ? 'orders' : 'overview') as 'overview' | 'orders';

  const fetchOrders = () => {
    api.getUserReservations(user.id).then(setReservations);
  };

  useEffect(() => {
    fetchOrders();

    const handleOrderUpdate = (updatedOrder: Reservation) => {
      if (updatedOrder.userId === user.id) {
        setReservations((prev) =>
          prev.map((r) => (r.id === updatedOrder.id ? { ...r, status: updatedOrder.status } : r))
        );
      }
    };

    socket.on('order-updated', handleOrderUpdate);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
    };
  }, [user.id]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold dark:text-white">Welcome back, {user.name}! 👋</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's a summary of your eco journey.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setSearchParams({})}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Your Orders
          {reservations.length > 0 && (
            <span className="bg-eco-500 text-white text-xs rounded-full px-2 py-0.5">{reservations.length}</span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eco Points Card */}
          <div className="bg-gradient-to-br from-eco-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-eco-100 text-sm font-medium">Eco Points Earned</p>
                <p className="text-5xl font-bold mt-1">{user.ecoPoints}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Leaf size={28} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-sm">
              <div>
                <div className="font-bold text-xl">{Math.round((user.ecoPoints || 0) * 0.12)}kg</div>
                <div className="text-eco-200">CO2 Saved</div>
              </div>
              <div>
                <div className="font-bold text-xl">INR {(user.ecoPoints || 0) * 5}</div>
                <div className="text-eco-200">Value Saved</div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-gray-200 dark:border-dark-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">My Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-eco-100 dark:bg-eco-900/50 rounded-full flex items-center justify-center text-eco-600 font-bold text-lg">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pt-2">
                <div className="flex justify-between"><span>Total Orders</span><span className="font-bold text-gray-900 dark:text-white">{reservations.length}</span></div>
                <div className="flex justify-between"><span>Active Orders</span><span className="font-bold text-orange-500">{reservations.filter(r => r.status !== 'completed').length}</span></div>
                <div className="flex justify-between"><span>Delivered</span><span className="font-bold text-green-500">{reservations.filter(r => r.status === 'completed').length}</span></div>
              </div>
            </div>
          </div>

          {/* Quick Action */}
          <div className="md:col-span-2 bg-eco-50 dark:bg-eco-900/20 rounded-2xl p-6 border border-eco-200 dark:border-eco-900/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-eco-800 dark:text-eco-300">Ready to save more food?</h3>
              <p className="text-sm text-eco-600 dark:text-eco-400 mt-1">Browse the marketplace to rescue surplus food near you!</p>
            </div>
            <a href="/#/marketplace" className="bg-eco-600 hover:bg-eco-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap ml-4">
              Browse Marketplace
            </a>
          </div>
        </div>
      )}

      {/* Your Orders Tab */}
      {activeTab === 'orders' && (
        <OrdersAccordion reservations={reservations} />
      )}
    </div>
  );
};




const CharityDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [donations, setDonations] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') === 'orders' ? 'orders' : 'overview') as 'overview' | 'orders';

  const fetchDonations = async () => {
    const allItems = await api.getItems();
    setDonations(allItems.filter((i) => !!i.forCharity && i.status === 'available' && i.quantity > 0));
  };

  const fetchOrders = () => {
    api.getUserReservations(user.id).then(setReservations);
  };

  useEffect(() => {
    fetchDonations();
    fetchOrders();

    const handleOrderUpdate = (updatedOrder: Reservation) => {
      if (updatedOrder.userId === user.id) {
        setReservations((prev) =>
          prev.map((r) => (r.id === updatedOrder.id ? { ...r, status: updatedOrder.status } : r))
        );
      }
    };

    socket.on('order-updated', handleOrderUpdate);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
    };
  }, [user.id]);

  const handleClaimDonation = async (item: Item) => {
    try {
      await api.createOrder(user.id, [item]);
      setSuccessOpen(true);
      fetchDonations();
      fetchOrders();
    } catch (error: any) {
      alert(error?.message || 'Failed to claim donation');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold dark:text-white">Charity Dashboard 👋</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Claim free surplus food and track your deliveries.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setSearchParams({})}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Available Donations
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Your Claims
          {reservations.length > 0 && (
            <span className="bg-eco-500 text-white text-xs rounded-full px-2 py-0.5">{reservations.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="mb-8">
          {donations.length === 0 ? (
            <div className="bg-white dark:bg-dark-900 p-8 rounded-xl text-center text-gray-500 border dark:border-dark-800">
              No charity-marked donations available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.map((d) => (
                <div key={d.id} className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border border-eco-200 dark:border-dark-800 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg dark:text-white">{d.title}</h4>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">FREE</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{d.storeName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <Package size={16} /> {d.quantity} units • <Calendar size={16} /> {d.pickupEnd}
                  </div>
                  <button onClick={() => handleClaimDonation(d)} className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold hover:bg-eco-700">
                    Claim Donation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <OrdersAccordion reservations={reservations} />
      )}

      <SuccessPopup open={successOpen} title="Donation Claimed" message="Donation claimed successfully. Volunteer delivery has been requested." onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

const VolunteerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  useEffect(() => {
    loadTasks();
  }, []);
  const loadTasks = async () => {
    try {
      const t = await api.getTasks();
      setTasks(t);
    } catch {
      setTasks([]);
    }
  };
  const handleAccept = async (id: string) => {
    await api.updateTaskStatus(id, 'accepted');
    loadTasks();
  };
  const handleComplete = async (id: string) => {
    await api.updateTaskStatus(id, 'completed');
    setSuccessOpen(true);
    loadTasks();
  };
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Volunteer Hub</h2>
          <p className="text-gray-500 dark:text-gray-400">Help transport food to those in need.</p>
        </div>
        <button
          onClick={() => setIsAvailable(!isAvailable)}
          className={`px-6 py-2 rounded-full font-bold transition ${isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          {isAvailable ? 'You are Online' : 'Go Online'}
        </button>
      </div>

      {!isAvailable ? (
        <div className="p-12 bg-white dark:bg-dark-900 rounded-xl shadow-sm border dark:border-dark-800 text-center">
          <Truck size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold mb-2 dark:text-white">You are currently offline</h3>
          <p className="text-gray-500">Switch your status to "Online" to see available pickup tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-lg dark:text-white border-b pb-2">Available Pickups</h3>
            {tasks.filter((t) => t.status === 'pending').length === 0 && <p className="text-gray-500">No tasks nearby.</p>}
            {tasks.filter((t) => t.status === 'pending').map((task) => (
              <div key={task.id} className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border dark:border-dark-800">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-eco-600">{task.weight} Food Rescue</span>
                </div>
                <div className="space-y-3 mb-4 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                    <div className="text-xs text-gray-400">PICKUP</div>
                    <div className="font-semibold">{task.storeName}</div>
                    <div className="text-xs">{task.pickupAddress}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">DROP OFF</div>
                    <div className="font-semibold">{task.charityName}</div>
                    <div className="text-xs">{task.dropAddress}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded text-xs">
                    Content: {task.itemsSummary}
                  </div>
                </div>
                <button onClick={() => handleAccept(task.id)} className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-eco-700">Accept</button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg dark:text-white border-b pb-2">Your Active Tasks</h3>
            {tasks.filter((t) => t.status === 'accepted').length === 0 && <p className="text-gray-500">No active deliveries.</p>}
            {tasks.filter((t) => t.status === 'accepted').map((task) => (
              <div key={task.id} className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold dark:text-white">Current Delivery</h4>
                  <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded font-bold">IN PROGRESS</span>
                </div>
                <div className="mb-4 text-sm space-y-1">
                  <p><strong>To:</strong> {task.charityName}</p>
                  <p><strong>Addr:</strong> {task.dropAddress}</p>
                </div>
                <button onClick={() => handleComplete(task.id)} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">
                  Mark Delivered
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <SuccessPopup open={successOpen} title="Order Delivered" message="Delivery marked as completed successfully." onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

export const Dashboards: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors">
      {user.role === 'retailer' && <RetailerDashboard user={user} />}
      {user.role === 'consumer' && <ConsumerDashboard user={user} />}
      {user.role === 'charity' && <CharityDashboard user={user} />}
      {user.role === 'volunteer' && <VolunteerDashboard user={user} />}
    </div>
  );
};
