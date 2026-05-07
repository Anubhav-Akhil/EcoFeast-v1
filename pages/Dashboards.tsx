import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Item, Reservation, StoreOrder, Task } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { predictExpiryAndTags } from '../services/aiService';
import { useSearchParams } from 'react-router-dom';
import { Plus, Package, Calendar, Camera, Leaf, Trash2, CheckSquare, Square, Truck, Upload, Search, PackagePlus, Layers3, TrendingUp, Sparkles, BadgeIndianRupee, ClipboardList, BadgeCheck, XCircle, Clock, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { SuccessPopup } from '../components/SuccessPopup';
import { AlertPopup, PopupType } from '../components/AlertPopup';
import { ConfirmPopup } from '../components/ConfirmPopup';
import {
  fieldLabelClassName,
  helperTextClassName,
  inputClassName,
  inputCompactClassName,
  ModalHeader,
  ModalShell,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
  textareaClassName,
} from '../components/ui';

interface DashboardProps {
  user: User;
}

export const statusBadge = (status?: string) => {
  const s = status || 'pending';
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    packed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ready: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    accepted: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    picked_up: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300',
  };
  return map[s] || 'bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-gray-300';
};

const RetailerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'listings') as 'listings' | 'orders' | 'pickups';

  const [items, setItems] = useState<Item[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [storeTasks, setStoreTasks] = useState<Task[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
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
  const [imagePromptOpen, setImagePromptOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; message: string; onConfirm: () => void; isDestructive?: boolean } | null>(null);
  const [highlightImage, setHighlightImage] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

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
    refreshFulfillment();

    const handleNewOrder = (payload: any) => {
      if (payload?.storeId === user.id) {
        // For new orders, a full refresh is safest to get all aggregate fields.
        refreshFulfillment(true); 
        openSuccess('New Order Received!', `Order #${payload.code} has just arrived for your store.`);
      }
    };
    const handleTaskUpdated = (task: Task) => {
      if (task?.storeId !== user.id) return;
      
      setStoreTasks(prev => prev.map(t => t.id === task.id ? task : t));
      setStoreOrders(prev => prev.map(so => {
        if (so.order.id === task.orderId) {
          return { ...so, task };
        }
        return so;
      }));
    };
    const handleOrderUpdated = (order: Reservation) => {
      setStoreOrders(prev => prev.map(so => {
        if (so.order.id === order.id) {
          return { ...so, order };
        }
        return so;
      }));
    };

    socket.on('new-order', handleNewOrder);
    socket.on('task-updated', handleTaskUpdated as any);
    socket.on('order-updated', handleOrderUpdated as any);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('task-updated', handleTaskUpdated as any);
      socket.off('order-updated', handleOrderUpdated as any);
    };
  }, []);

  const loadStoreData = async () => {
    const items = await api.getMyItems();
    setItems(items);
  };

  const refreshFulfillment = async (silent = false) => {
    if (!silent) {
      setOrdersLoading(true);
      setTasksLoading(true);
    }
    try {
      const data = await api.getFulfillmentData();
      setStoreOrders(Array.isArray(data?.orders) ? data.orders : []);
      setStoreTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch {
      setStoreOrders([]);
      setStoreTasks([]);
    } finally {
      setOrdersLoading(false);
      setTasksLoading(false);
    }
  };

  const openSuccess = (title: string, message: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setSuccessOpen(true);
  };

  const openError = (title: string, message: string) => {
    openAlert('error', title, message);
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

  const generateImage = () => {
    if (!newItem.title) {
       openAlert('warning', 'Missing Details', "Please enter an Item Name first to generate an image.");
       return;
    }
    setIsGeneratingImg(true);
    setTimeout(() => {
      const title = newItem.title || 'food';
      let keyword = title.toLowerCase();
      if (keyword.includes('sushi')) keyword += ',korean,japanese,food,delicious';
      else keyword = keyword.split(' ').join(',');
      
      // Deterministic lock based on title string
      const lock = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
      const url = `https://loremflickr.com/800/600/${encodeURIComponent(keyword)}?lock=${lock}`;
      
      setNewItem(prev => ({ ...prev, image: url }));
      setIsGeneratingImg(false);
      setHighlightImage(false);
    }, 1500);
  };

  const handleSubmit = async (e?: React.FormEvent, skipImageCheck = false) => {
    if (e) e.preventDefault();
    if (!newItem.title || !newItem.description) return;
    
    if (!newItem.image && !skipImageCheck) {
      setImagePromptOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await api.addItem({
        ...newItem,
        storeId: user.id,
        storeName: user.organizationName || 'My Store',
        pickupStart: '10:00',
        pickupEnd: '20:00',
        expiry: newItem.expiry || new Date(Date.now() + 86400000).toISOString(),
        image: newItem.image || '/custom-placeholder.png',
        category: newItem.forAnimalFeed ? 'compost' : (newItem.category || 'grocery'),
        discountPrice: newItem.forCharity ? 0 : Number(newItem.discountPrice || 0),
        forCharity: !!newItem.forCharity,
      } as any);
      setShowAdd(false);
      setNewItem({ title: '', description: '', originalPrice: 0, discountPrice: 0, category: 'meals', quantity: 1, tags: [], forAnimalFeed: false, forCharity: false, image: '' });
      await loadStoreData();
      openSuccess('Listing Created', 'Surplus item has been added successfully.');
    } catch (error: any) {
      openError('Listing Rejected', error?.message || 'Failed to add surplus item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      title: 'Remove Listing?',
      message: 'Are you sure you want to remove this surplus listing? This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        await api.deleteItem(id);
        await loadStoreData();
        openSuccess('Deleted', 'Item removed successfully.');
        setConfirmConfig(null);
      }
    });
  };

  const handleQuickRestock = async (item: Item, qty: number) => {
    let newQtyDelta = qty;
    if (qty < 0 && item.quantity + qty < 0) newQtyDelta = -item.quantity;
    if (newQtyDelta === 0) return;
    await api.updateItem(item.id, { quantityDelta: newQtyDelta });
    await loadStoreData();
    const action = newQtyDelta > 0 ? 'added to' : 'removed from';
    openSuccess('Stock Updated', `${Math.abs(newQtyDelta)} item${Math.abs(newQtyDelta) > 1 ? 's' : ''} ${action} "${item.title}".`);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty < 0) return;
    setRestockLoading(true);
    try {
      await api.updateItem(restockTarget.id, { quantity: restockQty });
      const targetTitle = restockTarget.title;
      setRestockTarget(null);
      setRestockQty(1);
      await loadStoreData();
      openSuccess('Stock Updated', `Stock for "${targetTitle}" set to ${restockQty}.`);
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

  const orderCounts = useMemo(() => {
    const pending = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'pending').length;
    const received = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'received').length;
    const packed = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'packed').length;
    const ready = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'ready').length;
    const accepted = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'accepted').length;
    const picked_up = storeOrders.filter((o) => (o.task?.status || o.order.status) === 'picked_up').length;
    return { pending, received, packed, ready, accepted, picked_up, total: storeOrders.length };
  }, [storeOrders]);

  const taskCounts = useMemo(() => {
    const pending = storeTasks.filter((t) => t.status === 'pending').length;
    const received = storeTasks.filter((t) => t.status === 'received').length;
    const packed = storeTasks.filter((t) => t.status === 'packed').length;
    const ready = storeTasks.filter((t) => t.status === 'ready').length;
    const accepted = storeTasks.filter((t) => t.status === 'accepted').length;
    const picked_up = storeTasks.filter((t) => t.status === 'picked_up').length;
    return { pending, received, packed, ready, accepted, picked_up, total: storeTasks.length };
  }, [storeTasks]);



  const handleMarkReceived = async (taskId: string) => {
    // Optimistic update
    setStoreTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'received' } : t));
    setStoreOrders(prev => prev.map(so => (so.task?.id === taskId ? { ...so, task: { ...so.task, status: 'received' } as Task } : so)));
    
    try {
      await api.updateTaskStatus(taskId, 'received');
      openSuccess('Order Received', 'Order status updated to RECEIVED.');
    } catch (err: any) {
      refreshFulfillment(true); // Revert on failure
      openError('Update Failed', err.message || 'Could not update task status.');
    }
  };

  const handleMarkPacked = async (taskId: string) => {
    // Optimistic update
    setStoreTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'packed' } : t));
    setStoreOrders(prev => prev.map(so => (so.task?.id === taskId ? { ...so, task: { ...so.task, status: 'packed' } as Task } : so)));

    try {
      await api.updateTaskStatus(taskId, 'packed');
      openSuccess('Order Packed', 'Order status updated to PACKED.');
    } catch (err: any) {
      refreshFulfillment(true);
      openError('Update Failed', err.message || 'Could not update task status.');
    }
  };

  const handleMarkReady = async (taskId: string) => {
    // Optimistic update
    setStoreTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'ready' } : t));
    setStoreOrders(prev => prev.map(so => (so.task?.id === taskId ? { ...so, task: { ...so.task, status: 'ready' } as Task } : so)));

    try {
      await api.updateTaskStatus(taskId, 'ready');
      openSuccess('Marked Ready', 'Pickup is now marked as READY.');
    } catch (err: any) {
      refreshFulfillment(true);
      openError('Update Failed', err.message || 'Could not update task status.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setConfirmConfig({
      title: 'Cancel Store Order?',
      message: "Are you sure you want to cancel your store's part of this order? Items will be restocked automatically.",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await api.cancelStoreOrder(orderId);
          await refreshFulfillment(true);
          openSuccess('Order Cancelled', 'Store items were restocked and the pickup was cancelled.');
        } catch (err: any) {
          openError('Cancel Failed', err.message || 'Could not cancel order.');
        }
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black dark:text-white tracking-tight">Retailer Command Center</h2>
          <p className="text-gray-500 dark:text-gray-400">Control all your listings for customers, charities, and animal-use in one dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshFulfillment()}
            className="flex items-center gap-2 bg-white dark:bg-dark-900 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800 shadow-sm"
            title="Refresh orders and pickups"
          >
            <RefreshCw size={18} className={ordersLoading || tasksLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {activeTab === 'listings' && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-eco-600 text-white px-4 py-2 rounded-lg hover:bg-eco-700 shadow-sm">
              <Plus size={18} /> Add Surplus
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-dark-800">
        <button
          onClick={() => setSearchParams({ tab: 'listings' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package size={16} /> Listings
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ClipboardList size={16} /> Orders
          {orderCounts.total > 0 && (
            <span className="bg-eco-500 text-white text-xs rounded-full px-2 py-0.5 font-black">{orderCounts.total}</span>
          )}
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'pickups' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pickups'
              ? 'border-eco-500 text-eco-600 dark:text-eco-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Truck size={16} /> Pickups
          {taskCounts.total > 0 && (
            <span className="bg-eco-500 text-white text-xs rounded-full px-2 py-0.5 font-black">{taskCounts.total}</span>
          )}
        </button>
      </div>

      {activeTab === 'listings' && (
      <>
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
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-dark-700 rounded-lg p-0.5 bg-gray-50 dark:bg-dark-800">
                    <button 
                      onClick={() => handleQuickRestock(item, -1)} 
                      disabled={item.quantity === 0} 
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent text-gray-600 dark:text-gray-300 hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/40 dark:hover:text-orange-400 disabled:opacity-30 transition-colors font-bold text-lg leading-none pb-0.5" 
                      title="Decrease Stock"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold w-16 text-center text-gray-800 dark:text-white" title="Current Stock">Stock: {item.quantity}</span>
                    <button 
                      onClick={() => handleQuickRestock(item, 1)} 
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent text-gray-600 dark:text-gray-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400 transition-colors font-bold text-lg leading-none pb-0.5" 
                      title="Increase Stock"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => { setRestockTarget(item); setRestockQty(item.quantity); }} className="px-3 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 flex items-center gap-1" title="Set exact stock amount">
                    <PackagePlus size={14} /> Edit Stock
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
                    onClick={() => { setRestockTarget(item); setRestockQty(item.quantity); }}
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
      </>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 shadow-sm">
              <div className="text-sm font-semibold text-gray-500">Total Orders</div>
              <div className="text-3xl font-black mt-1 dark:text-white">{orderCounts.total}</div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 shadow-sm">
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">New / Pending</div>
              <div className="text-3xl font-black mt-1 text-amber-800 dark:text-amber-200">{orderCounts.pending + orderCounts.received}</div>
            </div>
            <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-900/30 shadow-sm">
              <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">Ready to Pickup</div>
              <div className="text-3xl font-black mt-1 text-violet-800 dark:text-violet-200">{orderCounts.ready}</div>
            </div>
            <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-900/30 shadow-sm">
              <div className="text-sm font-semibold text-sky-700 dark:text-sky-300">Out for Delivery</div>
              <div className="text-3xl font-black mt-1 text-sky-800 dark:text-sky-200">{orderCounts.accepted + orderCounts.picked_up}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold dark:text-white flex items-center gap-2"><ClipboardList size={18} /> Store Orders</h3>
            </div>

            {ordersLoading ? (
              <div className="py-16 text-center space-y-4">
                <div className="flex justify-center">
                  <RefreshCw className="text-eco-500 animate-spin" size={40} />
                </div>
                <div className="text-gray-500 font-medium animate-pulse">Fetching your latest orders...</div>
              </div>
            ) : storeOrders.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No orders for your store yet.</div>
            ) : (
              <div className="space-y-4">
                {[...storeOrders].sort((a, b) => {
                  // Sort by most-recently-updated task, then order
                  const tA = new Date(a.task?.updatedAt || a.order.createdAt || 0).getTime();
                  const tB = new Date(b.task?.updatedAt || b.order.createdAt || 0).getTime();
                  return tB - tA;
                }).map((row) => {
                  const status = row.task?.status || row.order.status || 'pending';
                  const date = row.order.timestamp ? new Date(row.order.timestamp) : null;
                  const dateStr = date ? date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={row.order.id} className="p-4 rounded-2xl border border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-950/30">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-gray-900 dark:text-white">#{row.order.code}</span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${statusBadge(status)}`}>{String(status).toUpperCase()}</span>
                            {dateStr && <span className="text-xs text-gray-400">{dateStr}</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1"><Package size={14} /> {row.totalQty} unit(s)</span>
                            <span className="inline-flex items-center gap-1"><BadgeIndianRupee size={14} /> INR {row.totalAmount}</span>
                            {(row.pickupStart || row.pickupEnd) && (
                              <span className="inline-flex items-center gap-1"><Clock size={14} /> Pickup {row.pickupStart || '--'}-{row.pickupEnd || '--'}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {row.task?.id && status === 'pending' && (
                            <button
                              onClick={() => handleMarkReceived(row.task!.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Mark Received
                            </button>
                          )}
                          {row.task?.id && status === 'received' && (
                            <button
                              onClick={() => handleMarkPacked(row.task!.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Mark Packed
                            </button>
                          )}
                          {row.task?.id && status === 'packed' && (
                            <button
                              onClick={() => handleMarkReady(row.task!.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-eco-600 text-white hover:bg-eco-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Confirm Pickup
                            </button>
                          )}
                          {(status === 'pending' || status === 'ready') && (
                            <button
                              onClick={() => handleCancelOrder(row.order.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                            >
                              <XCircle size={16} /> Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {row.storeItems?.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {row.storeItems.slice(0, 6).map((item, idx) => (
                            <div key={`${row.order.id}_${item.id}_${idx}`} className="flex items-center gap-3 bg-white dark:bg-dark-900 rounded-xl p-3 border border-gray-200 dark:border-dark-800">
                              <img src={item.image} alt={item.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.title}</div>
                                <div className="text-xs text-gray-400 capitalize">{item.category}</div>
                              </div>
                              <div className="text-sm font-black text-eco-600 dark:text-eco-400">{item.discountPrice === 0 ? 'FREE' : `INR ${item.discountPrice}`}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pickups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 shadow-sm">
              <div className="text-sm font-semibold text-gray-500">Total Pickups</div>
              <div className="text-3xl font-black mt-1 dark:text-white">{taskCounts.total}</div>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 shadow-sm">
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">Waiting for Ready</div>
              <div className="text-3xl font-black mt-1 text-amber-800 dark:text-amber-200">{taskCounts.pending + taskCounts.received + taskCounts.packed}</div>
            </div>
            <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-900/30 shadow-sm">
              <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">Available to Partners</div>
              <div className="text-3xl font-black mt-1 text-violet-800 dark:text-violet-200">{taskCounts.ready}</div>
            </div>
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 shadow-sm">
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">In Transit</div>
              <div className="text-3xl font-black mt-1 text-blue-800 dark:text-blue-200">{taskCounts.accepted}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-800">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold dark:text-white flex items-center gap-2"><Truck size={18} /> Pickups For My Store</h3>
            </div>

            {tasksLoading ? (
              <div className="py-16 text-center space-y-4">
                <div className="flex justify-center">
                  <RefreshCw className="text-eco-500 animate-spin" size={40} />
                </div>
                <div className="text-gray-500 font-medium animate-pulse">Loading pickup tasks...</div>
              </div>
            ) : storeTasks.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No pickup tasks yet.</div>
            ) : (
              <div className="space-y-3">
                {[...storeTasks].sort((a, b) => {
                  // Most recently updated first
                  const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                  const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                  return tB - tA;
                }).map((task) => (
                  <div key={task.id} className="p-4 rounded-2xl border border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-950/30">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white">{task.storeName}</span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${statusBadge(task.status)}`}>{String(task.status).toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Truck size={14} /> {task.weight}</span>
                            {task.orderId && <span className="font-mono text-gray-400">order:{task.orderId}</span>}
                          </div>
                          <div className="text-gray-500">Drop: <span className="font-semibold text-gray-700 dark:text-gray-200">{task.charityName}</span></div>
                          <div className="text-gray-500">Items: <span className="text-gray-700 dark:text-gray-200">{task.itemsSummary}</span></div>
                        </div>
                      </div>

                        {task.status === 'ready' && (
                          <div className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-xl border border-violet-100 dark:border-violet-800 flex items-center gap-2">
                             <Clock size={14} /> Waiting for delivery partner to pickup
                          </div>
                        )}
                        {task.status === 'accepted' && (
                          <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-3 py-2 rounded-xl border border-cyan-100 dark:border-cyan-800 flex items-center gap-2">
                             <Truck size={14} /> {task.volunteerName || 'Volunteer'} is coming to pick up the order
                          </div>
                        )}
                        {task.status === 'picked_up' && (
                          <div className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-3 py-2 rounded-xl border border-sky-100 dark:border-sky-800 flex items-center gap-2">
                             <BadgeCheck size={14} /> Order Picked Up
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleMarkReceived(task.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Accept Order
                            </button>
                          )}
                          {task.status === 'received' && (
                            <button
                              onClick={() => handleMarkPacked(task.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Mark Packed
                            </button>
                          )}
                          {task.status === 'packed' && (
                            <button
                              onClick={() => handleMarkReady(task.id)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-2"
                            >
                              <BadgeCheck size={16} /> Mark Ready
                            </button>
                          )}
                          {(['pending', 'received', 'packed', 'ready'].includes(task.status)) && task.orderId && (
                            <button
                              onClick={() => handleCancelOrder(task.orderId as string)}
                              className="px-3 py-2 rounded-xl text-sm font-bold bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                            >
                              <XCircle size={16} /> Cancel
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ModalShell open={!!restockTarget} onClose={() => setRestockTarget(null)} maxWidthClassName="max-w-md">
        {restockTarget && (
          <div className="space-y-6">
            <ModalHeader
              title="Adjust Inventory"
              description={`Set the exact live stock level for ${restockTarget.title}.`}
              eyebrow="Listing Controls"
            />
            <form onSubmit={handleRestockSubmit} className="space-y-5">
              <div>
                <label className={fieldLabelClassName}>Available Units</label>
                <input
                  type="number"
                  min={0}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className={inputClassName}
                />
                <p className={helperTextClassName}>Use `0` to mark the listing as sold out without deleting it.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button disabled={restockLoading} type="submit" className={primaryButtonClassName}>
                  {restockLoading ? 'Saving...' : 'Update Stock'}
                </button>
                <button type="button" onClick={() => setRestockTarget(null)} className={secondaryButtonClassName}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={showAdd}
        onClose={() => setShowAdd(false)}
        maxWidthClassName="max-w-2xl"
        panelClassName="max-h-[92vh]"
        contentClassName="max-h-[92vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="space-y-6">
          <ModalHeader
            title="List New Surplus"
            description="Create a polished listing with strong details, clear pricing, and better photo coverage."
            eyebrow="New Listing"
          />
          <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={fieldLabelClassName}>Item Name</label>
                <div className="flex gap-2">
                  <input
                    required
                    className={inputClassName}
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="e.g. Assorted Bagels"
                  />
                  <button type="button" onClick={handleAiAnalysis} disabled={aiLoading || !newItem.title} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300" title="Auto-fill with AI">
                    {aiLoading ? '...' : <Camera size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Description</label>
                <textarea
                  required
                  rows={4}
                  className={textareaClassName}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe item quality and quantity"
                />
              </div>

              <div>
                <label className={fieldLabelClassName}>Item Image</label>
                <div className={`rounded-[24px] border border-dashed p-4 ${highlightImage ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/15 transition-all dark:bg-emerald-950/30' : 'border-slate-300 bg-slate-50/80 dark:border-dark-700 dark:bg-dark-950/60'}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
                    <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300 dark:hover:text-emerald-300">
                      <Upload size={16} /> Upload Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                    </label>
                    <span className="hidden text-gray-300 dark:text-gray-600 sm:block">or</span>
                    <button 
                      type="button"
                      onClick={generateImage}
                      disabled={isGeneratingImg || !newItem.title}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300 dark:hover:text-emerald-300"
                    >
                      <Sparkles size={16} /> {isGeneratingImg ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                </div>
                {newItem.image && <img src={newItem.image} className="mt-3 h-28 w-full object-cover rounded-lg" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Category</label>
                  <select
                    className={selectClassName}
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
                  <label className={fieldLabelClassName}>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClassName}
                    value={newItem.quantity || 1}
                    onChange={(e) => setNewItem({ ...newItem, quantity: +e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={fieldLabelClassName}>Original Price (INR)</label>
                  <input type="number" className={inputClassName} value={newItem.originalPrice || 0} onChange={(e) => setNewItem({ ...newItem, originalPrice: +e.target.value })} />
                </div>
                <div>
                  <label className={fieldLabelClassName}>Discount Price (INR)</label>
                  <input type="number" className={`${inputClassName} disabled:opacity-60`} value={newItem.discountPrice || 0} onChange={(e) => setNewItem({ ...newItem, discountPrice: +e.target.value })} disabled={!!newItem.forCharity} />
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

              <button disabled={submitting} type="submit" className={`w-full ${primaryButtonClassName}`}>
                {submitting ? 'Adding...' : 'Add Surplus Item'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className={`w-full ${secondaryButtonClassName}`}>Cancel</button>
            </form>
          </div>
      </ModalShell>

      <ModalShell open={!!priceTarget} onClose={() => setPriceTarget(null)} maxWidthClassName="max-w-md">
        {priceTarget && (
          <div className="space-y-6">
            <ModalHeader
              title="Update Pricing"
              description={`Refine how ${priceTarget.title} appears to customers and charity partners.`}
              eyebrow="Pricing"
            />
            <form onSubmit={handlePriceUpdate} className="space-y-5">
              <div>
                <label className={fieldLabelClassName}>Original Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={priceForm.originalPrice}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={fieldLabelClassName}>Discount Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  disabled={!!priceTarget.forCharity}
                  value={priceTarget.forCharity ? 0 : priceForm.discountPrice}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, discountPrice: Number(e.target.value) }))}
                  className={`${inputClassName} disabled:opacity-60`}
                />
                {priceTarget.forCharity && (
                  <p className={helperTextClassName}>Charity listings stay free to keep donation claims frictionless.</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button disabled={priceSaving} type="submit" className={primaryButtonClassName}>
                  {priceSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setPriceTarget(null)} className={secondaryButtonClassName}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalShell>

      {confirmConfig && (
        <ConfirmPopup
          open={!!confirmConfig}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isDestructive={confirmConfig.isDestructive}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      <ModalShell open={imagePromptOpen} onClose={() => setImagePromptOpen(false)} maxWidthClassName="max-w-md">
        <div className="space-y-6">
          <ModalHeader
            title="Add a Listing Image?"
            description="A clear photo makes surplus items feel trustworthy and helps reservations convert faster."
            icon={<Camera size={24} />}
            tone="warning"
            eyebrow="Recommended"
          />
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                setImagePromptOpen(false);
                setHighlightImage(true);
                setTimeout(() => setHighlightImage(false), 3000);
              }}
              className={primaryButtonClassName}
            >
              Upload or Generate Image
            </button>
            <button
              onClick={() => {
                setImagePromptOpen(false);
                handleSubmit(undefined, true);
              }}
              className={secondaryButtonClassName}
            >
              Continue Without Image
            </button>
          </div>
        </div>
      </ModalShell>

          <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
          <SuccessPopup open={successOpen} title={successTitle} message={successMessage} onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

// Orders accordion component - tracks which order is expanded
const OrdersAccordion: React.FC<{ reservations: Reservation[]; viewer?: User; loading?: boolean }> = ({ reservations, viewer, loading }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tasksByOrderId, setTasksByOrderId] = useState<Record<string, Task[]>>({});
  const [tasksLoadingByOrderId, setTasksLoadingByOrderId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleTaskUpdate = (task: Task) => {
      if (!task?.orderId) return;
      setTasksByOrderId((prev) => {
        const existing = prev[task.orderId as string];
        if (!existing) return prev;
        const next = existing.some((t) => t.id === task.id)
          ? existing.map((t) => (t.id === task.id ? task : t))
          : [task, ...existing];
        return { ...prev, [task.orderId as string]: next };
      });
    };
    socket.on('task-updated', handleTaskUpdate as any);
    return () => {
      socket.off('task-updated', handleTaskUpdate as any);
    };
  }, []);

  const ensureOrderTasksLoaded = async (orderId: string) => {
    if (!viewer) return;
    if (tasksByOrderId[orderId]) return;
    setTasksLoadingByOrderId((prev) => ({ ...prev, [orderId]: true }));
    try {
      const tasks = await api.getOrderTasks(orderId);
      setTasksByOrderId((prev) => ({ ...prev, [orderId]: tasks }));
    } catch {
      setTasksByOrderId((prev) => ({ ...prev, [orderId]: [] }));
    } finally {
      setTasksLoadingByOrderId((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-800 p-5 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-dark-800 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-dark-800 rounded" />
                  <div className="h-3 w-32 bg-gray-100 dark:bg-dark-800/50 rounded" />
                </div>
              </div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-dark-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
        const currentStatus = res.status === 'cancelled' ? (res.lastStatus || 'pending') : res.status;
        const orderTasks = tasksByOrderId[res.id] || [];
        const taskStatuses = orderTasks.map(t => t.status);
        
        // Find the most advanced status among all tasks
        const getStep = (s: string) => 
          s === 'completed' ? 8 : 
          s === 'picked_up' ? 7 :
          s === 'accepted' ? 6 : 
          s === 'ready' ? 5 : 
          s === 'packed' ? 4 : 
          s === 'received' ? 3 : 
          s === 'pending' ? 2 : 1;

        let statusStep = Math.max(1, ...taskStatuses.map(getStep));
        
        // If it's cancelled, we want to know how far it got before cancellation
        // If all tasks are cancelled, statusStep will be 1 (from getStep('cancelled'))
        // So we fall back to res.lastStatus or 1
        if (res.status === 'cancelled' && statusStep <= 2) {
           statusStep = getStep(res.lastStatus || 'pending');
        } else if (res.status !== 'cancelled') {
           // Standard case: statusStep is already calculated from tasks
        }

        const statusConfig: Record<string, { label: string; badge: string; bar: string }> = {
          pending:   { label: 'Order Received', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-400' },
          received:  { label: 'Confirmed',      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', bar: 'bg-blue-400' },
          packed:    { label: 'Packed',         badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', bar: 'bg-indigo-400' },
          ready:     { label: 'Ready',          badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', bar: 'bg-violet-500' },
          accepted:  { label: 'On The Way',      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',    bar: 'bg-cyan-500'  },
          picked_up: { label: 'Out for Delivery',badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', bar: 'bg-orange-500' },
          completed: { label: 'Delivered',       badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', bar: 'bg-green-500' },
          cancelled: { label: 'Cancelled',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',         bar: 'bg-red-500'  },
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
          { label: 'Order Placed',   desc: 'Your request is in the system.',     done: statusStep >= 1 },
          { label: 'Store Received', desc: 'Retailer is preparing items.',       done: statusStep >= 3 },
          { label: 'Packed & Ready', desc: 'Items are bagged for pickup.',       done: statusStep >= 4 },
          { label: 'Partner Assigned', desc: 'A volunteer is coming to pick up.', done: statusStep >= 6 },
          { label: 'Picked Up',      desc: 'Order is on the way to you.',        done: statusStep >= 7 },
          { label: 'Delivered',      desc: 'Enjoy your rescued food!',           done: statusStep >= 8 },
        ];

        if (res.status === 'cancelled') {
          // Find where the progress stopped and insert "Cancelled" there
          const lastDoneIndex = [...steps].reverse().findIndex(s => s.done);
          const insertIndex = lastDoneIndex === -1 ? 0 : steps.length - lastDoneIndex;
          steps.splice(insertIndex, 0, { 
            label: 'Order Cancelled', 
            desc: 'This order was cancelled by the retailer.', 
            done: true,
            isError: true 
          });
        }

        return (
          <div key={res.id} className="bg-white dark:bg-dark-900 rounded-2xl border border-gray-200 dark:border-dark-800 shadow-sm overflow-hidden">
            <button
              onClick={() => {
                const next = isExpanded ? null : res.id;
                setExpandedId(next);
                if (next) ensureOrderTasksLoaded(next);
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-10 w-1 rounded-full flex-shrink-0 ${sc.bar}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-gray-900 dark:text-white text-base">#{res.code}</span>
                    {res.deliveryOtp && res.status !== 'cancelled' && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-md font-bold border border-yellow-200">
                        Delivery OTP: {res.deliveryOtp}
                      </span>
                    )}
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
                      {viewer && (
                        <div className="mb-2">
                          {tasksLoadingByOrderId[res.id] ? (
                            <div className="text-xs text-gray-400">Loading pickup status...</div>
                          ) : (
                            (() => {
                              const orderTasks = tasksByOrderId[res.id] || [];
                              const storeId = storeItems?.[0]?.storeId;
                              const matchingTask =
                                orderTasks.find((t) => storeId && t.storeId === storeId) ||
                                orderTasks.find((t) => t.storeName === storeName);
                              const s = matchingTask?.status || 'pending';
                                const labelMap: Record<string, string> = {
                                  pending: 'Order sent to store',
                                  received: 'Order confirmed by store',
                                  packed: 'Order packed',
                                  ready: 'Waiting for delivery partner to pickup',
                                  accepted: `${matchingTask?.volunteerName || 'Partner'} is coming to pick up the order`,
                                  picked_up: 'He is on the way. Give delivery OTP at the time of delivery.',
                                  completed: 'Delivered',
                                  cancelled: 'Cancelled by store',
                                };
                              return (
                                <div className="p-3 rounded-xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                      {['ready', 'accepted', 'picked_up', 'completed'].includes(s) ? 'Delivery Side Progress' : 'Retailer Side Progress'}:{' '}
                                      <span className="text-eco-600 dark:text-eco-400">
                                        {labelMap[s] || String(s)}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${statusBadge(s)}`}>
                                      {String(s).toUpperCase()}
                                    </span>
                                  </div>
                                  {matchingTask?.volunteerName && (['accepted', 'picked_up', 'completed'].includes(s)) && (
                                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                      <div className="flex items-center gap-2 mb-1">
                                         <Truck size={12} className="text-blue-500" />
                                         <span className="font-bold text-blue-700 dark:text-blue-300">Delivery Partner Details</span>
                                      </div>
                                      <div className="ml-5">
                                        <p>Name: <span className="font-bold text-gray-900 dark:text-white">{matchingTask.volunteerName}</span></p>
                                        {matchingTask.volunteerVehicleType && <p>Vehicle: <span className="font-bold text-gray-900 dark:text-white">{matchingTask.volunteerVehicleType}</span></p>}
                                        {matchingTask.volunteerPhone && <p>Phone: <span className="font-bold text-gray-900 dark:text-white">{matchingTask.volunteerPhone}</span></p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
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
                            ? `${(step as any).isError ? 'bg-red-500' : sc.bar} border-white dark:border-dark-900 shadow-[0_0_8px_rgba(0,0,0,0.1)]`
                            : 'bg-gray-200 dark:bg-dark-700 border-white dark:border-dark-900'
                        }`} />
                        <div>
                          <p className={`text-sm font-bold leading-tight ${step.done ? ((step as any).isError ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white') : 'text-gray-400 dark:text-gray-600'}`}>{step.label}</p>
                          <p className={`text-xs mt-0.5 ${step.done ? ((step as any).isError ? 'text-red-400 dark:text-red-500/60' : 'text-gray-500 dark:text-gray-400') : 'text-gray-300 dark:text-gray-700'}`}>{step.desc}</p>
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
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'overview') as 'overview' | 'orders';

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getUserReservations(user.id),
      api.getMyTasks()
    ]).then(([orders, tasks]) => {
      setReservations(orders);
      setMyTasks(tasks);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    const handleOrderUpdate = (updatedOrder: Reservation) => {
      if (updatedOrder.userId === user.id) {
        setReservations((prev) => {
          const exists = prev.find((r) => r.id === updatedOrder.id);
          if (exists) {
            return prev.map((r) => (r.id === updatedOrder.id ? { ...r, ...updatedOrder } : r));
          } else {
            return [updatedOrder, ...prev];
          }
        });
      }
    };

    const handleTaskUpdate = (task: Task) => {
      if (!task?.orderId) return;
      setMyTasks((prev) => {
        const existing = prev.find((t) => t.id === task.id);
        if (!existing) return [task, ...prev];
        return prev.map((t) => (t.id === task.id ? task : t));
      });
    };

    socket.on('order-updated', handleOrderUpdate);
    socket.on('task-updated', handleTaskUpdate as any);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
      socket.off('task-updated', handleTaskUpdate as any);
    };
  }, [user.id]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold dark:text-white">Welcome back, {user.name}! {'\uD83D\uDC4B'}</h2>
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
        <OrdersAccordion reservations={reservations} viewer={user} loading={isLoading} />
      )}

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
    </div>
  );
};




const CharityDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [donations, setDonations] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'overview') as 'overview' | 'orders' | 'pickups';

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  const [isLoading, setIsLoading] = useState(true);

  const fetchDonations = async () => {
    const allItems = await api.getItems();
    setDonations(allItems.filter((i) => !!i.forCharity && i.status === 'available' && i.quantity > 0));
  };

  const fetchOrders = () => {
    api.getUserReservations(user.id).then((res) => {
      setReservations(res);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  };

  const fetchMyTasks = () => {
    api.getMyTasks().then(setMyTasks).catch(() => setMyTasks([]));
  };

  useEffect(() => {
    setIsLoading(true);
    fetchDonations();
    fetchOrders();
    fetchMyTasks();

    const handleOrderUpdate = (updatedOrder: Reservation) => {
      if (updatedOrder.userId === user.id) {
        setReservations((prev) => {
          const exists = prev.find((r) => r.id === updatedOrder.id);
          if (exists) {
            return prev.map((r) => (r.id === updatedOrder.id ? { ...r, ...updatedOrder } : r));
          } else {
            return [updatedOrder, ...prev];
          }
        });
      }
    };

    const handleTaskUpdate = (task: Task) => {
      if (!task?.orderId) return;
      setMyTasks((prev) => {
        const existing = prev.find((t) => t.id === task.id);
        if (!existing) return [task, ...prev];
        return prev.map((t) => (t.id === task.id ? task : t));
      });
    };

    socket.on('order-updated', handleOrderUpdate);
    socket.on('task-updated', handleTaskUpdate as any);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
      socket.off('task-updated', handleTaskUpdate as any);
    };
  }, [user.id]);

  const handleClaimDonation = async (item: Item) => {
    try {
      await api.createOrder(user.id, [item]);
      setSuccessOpen(true);
      fetchDonations();
      fetchOrders();
    } catch (error: any) {
      openAlert('error', 'Claim Failed', error?.message || 'Failed to claim donation. Please try again later.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold dark:text-white">Charity Dashboard {'\uD83D\uDC4B'}</h2>
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
        <OrdersAccordion reservations={reservations} viewer={user} loading={isLoading} />
      )}

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
      <SuccessPopup open={successOpen} title="Donation Claimed" message="Donation claimed successfully. Volunteer delivery has been requested." onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

const VolunteerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deliveryConfirmTarget, setDeliveryConfirmTarget] = useState<{ taskId: string; code: string } | null>(null);
  const [deliveryConfirmLoading, setDeliveryConfirmLoading] = useState(false);
  const deliveryOtpInputRef = useRef<HTMLInputElement | null>(null);
  
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };
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
  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await api.updateTaskStatus(taskId, status);
      loadTasks();
      if (status === 'picked_up') {
        openAlert('success', 'Order Picked Up', 'You have successfully picked up the order. Now head to the delivery location!');
      } else {
        setSuccessOpen(true);
      }
    } catch (err: any) {
      openAlert('error', 'Update Failed', err.message || 'Failed to update task status.');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.updateTaskStatus(id, 'accepted');
      loadTasks();
    } catch (err: any) {
      openAlert('error', 'Acceptance Failed', err.message || 'Could not accept this task.');
    }
  };
  
  const handleDeliveryConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryConfirmTarget) return;
    setDeliveryConfirmLoading(true);
    try {
      await api.deliverTask(deliveryConfirmTarget.taskId, deliveryConfirmTarget.code);
      setDeliveryConfirmTarget(null);
      setSuccessOpen(true);
      loadTasks();
    } catch (err: any) {
      openAlert('error', 'Invalid OTP', err.message || 'The delivery code you entered is incorrect. Please verify with the customer.');
    } finally {
      setDeliveryConfirmLoading(false);
    }
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
            {tasks.filter((t) => t.status === 'ready').length === 0 && <p className="text-gray-500">No tasks ready for pickup right now.</p>}
            {tasks.filter((t) => t.status === 'ready').map((task) => (
              <div key={task.id} className={`bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border dark:border-dark-800 ${task.status === 'ready' ? 'ring-2 ring-violet-400/50' : ''}`}>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-eco-600">{task.weight} Food Rescue</span>
                  {task.status === 'ready' && (
                    <span className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded font-bold">READY</span>
                  )}
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
                  <div className="bg-gray-50 dark:bg-dark-800 p-3 rounded-lg text-xs">
                    <div className="font-bold mb-1 text-gray-500 uppercase tracking-wider">Order Contents:</div>
                    {task.items && task.items.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {task.items.map((item, idx) => (
                          <li key={idx} className="text-gray-700 dark:text-gray-300">
                            {item.title} <span className="text-gray-400">({item.category})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">{task.itemsSummary}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleAccept(task.id)} className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-eco-700">Accept</button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg dark:text-white border-b pb-2">Your Active Tasks</h3>
            {tasks.filter((t) => t.status === 'accepted' || t.status === 'picked_up').length === 0 && <p className="text-gray-500">No active deliveries.</p>}
            {tasks.filter((t) => t.status === 'accepted' || t.status === 'picked_up').map((task) => (
              <div key={task.id} className={`p-5 rounded-xl border ${task.status === 'picked_up' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold dark:text-white">{task.status === 'picked_up' ? 'In Transit' : 'On the way to pickup'}</h4>
                  <span className={`text-xs px-2 py-1 rounded font-bold ${task.status === 'picked_up' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                    {task.status === 'picked_up' ? 'DELIVERING' : 'HEADING TO STORE'}
                  </span>
                </div>
                <div className="mb-4 text-sm space-y-2">
                  <p><strong>Store:</strong> {task.storeName}</p>
                  <p><strong>To:</strong> {task.charityName}</p>
                  <p><strong>Addr:</strong> {task.dropAddress}</p>
                  
                  <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg text-xs mt-3 border border-current opacity-80">
                    <div className="font-bold mb-1 uppercase tracking-wider">Order Contents:</div>
                    {task.items && task.items.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {task.items.map((item, idx) => (
                          <li key={idx}>{item.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>{task.itemsSummary}</span>
                    )}
                  </div>
                </div>
                
                {task.status === 'accepted' ? (
                  <button onClick={() => handleUpdateTaskStatus(task.id, 'picked_up')} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                    Confirm Pickup (Mark Picked Up)
                  </button>
                ) : (
                  <button onClick={() => setDeliveryConfirmTarget({ taskId: task.id, code: '' })} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700">
                    Submit OTP to Deliver
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ModalShell open={!!deliveryConfirmTarget} onClose={() => setDeliveryConfirmTarget(null)} maxWidthClassName="max-w-md">
        {deliveryConfirmTarget && (
          <div className="space-y-6">
            <ModalHeader
              title="Verify Delivery"
              description="Ask the customer for the 4-digit delivery OTP shown in their order details."
              icon={<BadgeCheck size={24} />}
              tone="success"
              eyebrow="Secure Handover"
              align="center"
            />

            <form onSubmit={handleDeliveryConfirm} className="space-y-5">
              <div className="space-y-3">
                <label className={`${fieldLabelClassName} text-center`}>Delivery OTP</label>
                <div
                  className="relative"
                  onClick={() => deliveryOtpInputRef.current?.focus()}
                >
                  <input
                    ref={deliveryOtpInputRef}
                    autoFocus
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    className="absolute inset-0 opacity-0"
                    value={deliveryConfirmTarget.code}
                    onChange={(e) => setDeliveryConfirmTarget({ ...deliveryConfirmTarget, code: e.target.value.replace(/\D/g, '') })}
                  />
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, index) => {
                      const digit = deliveryConfirmTarget.code[index] || '';
                      const isActive = deliveryConfirmTarget.code.length === index;
                      return (
                        <div
                          key={index}
                          className={`flex h-16 items-center justify-center rounded-2xl border text-2xl font-black shadow-sm transition-all ${
                            digit
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                              : isActive
                                ? 'border-emerald-400 bg-white text-slate-700 ring-4 ring-emerald-500/10 dark:bg-dark-800 dark:text-white'
                                : 'border-slate-200 bg-slate-50 text-slate-300 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-600'
                          }`}
                        >
                          {digit || '0'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500 dark:text-gray-400">
                  Enter digits only. The code is verified before completion.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  disabled={deliveryConfirmLoading || deliveryConfirmTarget.code.length !== 4}
                  type="submit"
                  className={primaryButtonClassName}
                >
                  {deliveryConfirmLoading ? 'Confirming...' : 'Confirm Delivery'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryConfirmTarget(null)}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </ModalShell>

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
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
