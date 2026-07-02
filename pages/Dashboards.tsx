import React, { useEffect, useMemo, useRef, useState } from 'react';
import { User, Item, Reservation, StoreOrder, Task } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { predictExpiryAndTags } from '../services/aiService';
import { useSearchParams } from 'react-router-dom';
import { Plus, Package, Calendar, Camera, Leaf, Trash2, CheckSquare, Square, Truck, Upload, Search, PackagePlus, Layers3, TrendingUp, Sparkles, BadgeIndianRupee, ClipboardList, BadgeCheck, XCircle, Clock, RefreshCw, ShoppingBag, MapPin } from 'lucide-react';
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
import { DeliveryTrackingMap } from '../components/DeliveryTrackingMap';

// Haversine formula to calculate distance in km between two lat/lng coordinates
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function formatDistanceAndTime(
  loc1: { lat: number; lng: number } | null | undefined,
  loc2: { lat: number; lng: number } | null | undefined
) {
  if (!loc1 || !loc2 || loc1.lat === null || loc1.lng === null || loc2.lat === null || loc2.lng === null) {
    return { distanceStr: 'N/A', timeStr: 'N/A' };
  }
  
  const distance = getHaversineDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  
  // Format distance
  const distanceStr = distance < 1 
    ? `${Math.round(distance * 1000)} m` 
    : `${distance.toFixed(1)} km`;
    
  // Estimate time: assume average speed is 20 km/h (3 minutes per km) 
  // Add a base buffer of 3 minutes for handovers / traffic
  const minutes = Math.max(2, Math.round(distance * 3 + 3));
  const timeStr = `${minutes} min`;
  
  return { distanceStr, timeStr };
}

interface DashboardProps {
  user: User;
}

const statusBadge = (status?: string) => {
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
    const orderId = searchParams.get('orderId');
    if (orderId && activeTab === 'orders') {
      setTimeout(() => {
        const el = document.getElementById(`order-${orderId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams, activeTab]);

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

      // Use Pollinations AI for reliable, fast, and high-quality food images instead of loremflickr
      const prompt = `${title} food photography, delicious, high quality, professional lighting`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;

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
    // Optimistic update — apply instantly
    const newQty = Math.max(0, item.quantity + newQtyDelta);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty, status: newQty <= 0 ? 'sold' : 'available' } : i));
    try {
      const updated = await api.updateItem(item.id, { quantityDelta: newQtyDelta });
      // Reconcile with server response
      setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      const action = newQtyDelta > 0 ? 'added to' : 'removed from';
      openSuccess('Stock Updated', `${Math.abs(newQtyDelta)} item${Math.abs(newQtyDelta) > 1 ? 's' : ''} ${action} "${item.title}".`);
    } catch (err: any) {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      openError('Update Failed', err.message || 'Could not update stock.');
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty < 0) return;
    setRestockLoading(true);
    try {
      const updated = await api.updateItem(restockTarget.id, { quantity: restockQty });
      const targetTitle = restockTarget.title;
      setRestockTarget(null);
      setRestockQty(1);
      // Apply server response directly instead of full refetch
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
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
      const updated = await api.updateItem(priceTarget.id, {
        originalPrice: Number(priceForm.originalPrice || 0),
        discountPrice: priceTarget.forCharity ? 0 : Number(priceForm.discountPrice || 0),
      });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Retailer Command Center</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage listings, fulfil orders, and track pickups in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshFulfillment()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} className={ordersLoading || tasksLoading ? 'animate-spin text-emerald-500' : ''} />
              Refresh
            </button>
            {activeTab === 'listings' && (
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <Plus size={16} /> Add Surplus
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-6">
          {[
            { key: 'listings', label: 'Listings', icon: Package, count: 0 },
            { key: 'orders', label: 'Orders', icon: ClipboardList, count: orderCounts.total },
            { key: 'pickups', label: 'Pickups', icon: Truck, count: taskCounts.total },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">

        {activeTab === 'listings' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Listings', value: items.length, color: 'emerald', sub: 'live on platform' },
                { label: 'Live Units', value: totalUnits, color: 'blue', sub: 'units available now' },
                { label: 'Charity Items', value: charityCount, color: 'violet', sub: 'marked for NGOs' },
                { label: 'Sold / Rescued', value: soldQuantity, color: 'rose', sub: 'units rescued total' },
              ].map(s => (
                <div key={s.label} className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-${s.color}-300 dark:hover:border-${s.color}-800 transition-all`}>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{s.label}</div>
                  <div className="text-3xl font-black text-slate-950 dark:text-white mt-2">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
                </div>
              ))}
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
                        className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${listingFilter === tab.key
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
                        <img src={item.image} className="w-20 h-20 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/custom-placeholder.png'; }} />
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
                      <div 
                        key={row.order.id} 
                        id={`order-${row.order.id}`}
                        className={`p-4 rounded-2xl border transition-all duration-500 ${
                          searchParams.get('orderId') === row.order.id 
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 ring-2 ring-emerald-500/20' 
                            : 'border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-950/30'
                        }`}
                      >
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
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/custom-placeholder.png'; }} />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-dark-800 flex items-center justify-center border border-gray-200 dark:border-dark-700">
                                    <Package size={18} className="text-gray-400" />
                                  </div>
                                )}
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
    </div>
  );
};

// Orders accordion component - tracks which order is expanded
const OrdersAccordion: React.FC<{ reservations: Reservation[]; viewer?: User; loading?: boolean }> = ({ reservations, viewer, loading }) => {
  const [searchParams] = useSearchParams();
  const orderIdFromUrl = searchParams.get('orderId');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tasksByOrderId, setTasksByOrderId] = useState<Record<string, Task[]>>({});
  const [tasksLoadingByOrderId, setTasksLoadingByOrderId] = useState<Record<string, boolean>>({});
  const [liveVolunteerLocations, setLiveVolunteerLocations] = useState<Record<string, { lat: number; lng: number; name?: string }>>({});

  useEffect(() => {
    const handleLocationUpdated = (data: { orderId: string; lat: number; lng: number; name?: string }) => {
      if (data && data.orderId) {
        setLiveVolunteerLocations((prev) => ({
          ...prev,
          [data.orderId]: { lat: data.lat, lng: data.lng, name: data.name },
        }));
      }
    };

    socket.on('volunteer-location-updated', handleLocationUpdated);

    // Initial check for any accepted/picked_up orders
    reservations.forEach(res => {
      if (res.status === 'accepted' || res.status === 'picked_up') {
        socket.emit('get-volunteer-location', { orderId: res.id });
      }
    });

    return () => {
      socket.off('volunteer-location-updated', handleLocationUpdated);
    };
  }, [reservations]);

  useEffect(() => {
    if (orderIdFromUrl && reservations.some(r => r.id === orderIdFromUrl)) {
      setExpandedId(orderIdFromUrl);
      ensureOrderTasksLoaded(orderIdFromUrl);
      setTimeout(() => {
        const el = document.getElementById(`order-${orderIdFromUrl}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
    }
  }, [orderIdFromUrl, reservations.length]);

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
          pending: { label: 'Order Received', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-400' },
          received: { label: 'Confirmed', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', bar: 'bg-blue-400' },
          packed: { label: 'Packed', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', bar: 'bg-indigo-400' },
          ready: { label: 'Ready', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', bar: 'bg-violet-500' },
          accepted: { label: 'On The Way', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', bar: 'bg-cyan-500' },
          picked_up: { label: 'Out for Delivery', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', bar: 'bg-orange-500' },
          completed: { label: 'Delivered', badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', bar: 'bg-green-500' },
          cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', bar: 'bg-red-500' },
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

        const steps: { label: string; desc: string; done: boolean; isError?: boolean }[] = [
          { label: 'Order Placed', desc: 'Your request is in the system.', done: statusStep >= 1 },
          { label: 'Store Received', desc: 'Retailer is preparing items.', done: statusStep >= 3 },
          { label: 'Packed & Ready', desc: 'Items are bagged for pickup.', done: statusStep >= 4 },
          { label: 'Partner Assigned', desc: 'A volunteer is coming to pick up.', done: statusStep >= 6 },
          { label: 'Picked Up', desc: 'Order is on the way to you.', done: statusStep >= 7 },
          { label: 'Delivered', desc: 'Enjoy your rescued food!', done: statusStep >= 8 },
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
          <div 
            key={res.id} 
            id={`order-${res.id}`}
            className={`bg-white dark:bg-dark-900 rounded-2xl border transition-all duration-500 shadow-sm overflow-hidden ${
              orderIdFromUrl === res.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-200 dark:border-dark-800'
            }`}
          >
            <button
              onClick={() => {
                const next = isExpanded ? null : res.id;
                setExpandedId(next);
                if (next) {
                  ensureOrderTasksLoaded(next);
                  if (res.status === 'accepted' || res.status === 'picked_up') {
                    socket.emit('get-volunteer-location', { orderId: res.id });
                  }
                }
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
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="h-11 w-11 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = '/custom-placeholder.png'; }} />
                            ) : (
                              <div className="h-11 w-11 rounded-lg flex-shrink-0 bg-gray-200 dark:bg-dark-700 flex items-center justify-center border border-gray-300 dark:border-dark-600">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
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
                        <div className={`absolute -left-5 mt-1 h-3 w-3 rounded-full border-2 z-10 ${step.done
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

                {/* Delivery Tracking Map */}
                {viewer?.location && (
                  <div className="px-5 pb-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                      <MapPin size={12} /> Live Tracking Map
                    </p>

                    {/* Dynamic Real-Time Travel Distance & Arrival Estimation */}
                    {(() => {
                      const tasks = tasksByOrderId[res.id] || [];
                      const activeTask = tasks.find(t => ['accepted', 'picked_up'].includes(t.status));
                      const storeLoc = (tasks[0] as any)?.storeLocation;
                      const customerLoc = viewer?.location;

                      if (activeTask) {
                        const volLoc = liveVolunteerLocations[res.id] || null;
                        
                        let targetLoc1 = volLoc;
                        let targetLoc2 = null;
                        let label = "";
                        
                        if (res.status === 'accepted' && storeLoc) {
                          targetLoc2 = storeLoc;
                          label = "Volunteer to Store";
                        } else if (res.status === 'picked_up' && customerLoc) {
                          targetLoc2 = customerLoc;
                          label = "Volunteer to You";
                        }
                        
                        if (targetLoc1 && targetLoc2) {
                          const { distanceStr, timeStr } = formatDistanceAndTime(targetLoc1, targetLoc2);
                          return (
                            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                              <div className="text-center border-r border-slate-200 dark:border-slate-850">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Distance ({label})</p>
                                <p className="font-black text-slate-950 dark:text-white text-base mt-0.5">{distanceStr}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Arrival Time</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-base mt-0.5">{timeStr}</p>
                              </div>
                            </div>
                          );
                        }
                      } else if (res.status === 'ready' && storeLoc && customerLoc) {
                        const { distanceStr, timeStr } = formatDistanceAndTime(storeLoc, customerLoc);
                        return (
                          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                            <div className="text-center border-r border-slate-200 dark:border-slate-850">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Delivery Distance</p>
                              <p className="font-black text-slate-950 dark:text-white text-base mt-0.5">{distanceStr}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Travel Time</p>
                              <p className="font-black text-slate-700 dark:text-slate-300 text-base mt-0.5">{timeStr}</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <DeliveryTrackingMap
                      storeLocation={(() => {
                        const tasks = tasksByOrderId[res.id] || [];
                        const firstTask = tasks[0];
                        if (firstTask) {
                          // Use real database store coordinates if populated
                          if ((firstTask as any).storeLocation) {
                            return {
                              lat: (firstTask as any).storeLocation.lat,
                              lng: (firstTask as any).storeLocation.lng,
                              name: firstTask.storeName,
                            };
                          }
                          // Fallback to offset
                          return {
                            lat: (viewer.location?.lat || 0) + 0.008,
                            lng: (viewer.location?.lng || 0) + 0.005,
                            name: firstTask.storeName,
                          };
                        }
                        return null;
                      })()}
                      customerLocation={viewer.location ? {
                        lat: viewer.location.lat,
                        lng: viewer.location.lng,
                        name: viewer.name,
                      } : null}
                      volunteerLocation={(() => {
                        const tasks = tasksByOrderId[res.id] || [];
                        const activeTask = tasks.find(t => ['accepted', 'picked_up'].includes(t.status));
                        if (activeTask) {
                          // Check if we have live tracking coordinates from socket
                          if (liveVolunteerLocations[res.id]) {
                            return {
                              lat: liveVolunteerLocations[res.id].lat,
                              lng: liveVolunteerLocations[res.id].lng,
                              name: liveVolunteerLocations[res.id].name || activeTask.volunteerName || 'Volunteer',
                            };
                          }
                          // Fallback to offset
                          if (viewer && viewer.location) {
                            return {
                              lat: viewer.location.lat + 0.003,
                              lng: viewer.location.lng + 0.002,
                              name: activeTask.volunteerName || 'Volunteer',
                            };
                          }
                        }
                        return null;
                      })()}
                      status={res.status}
                      height={280}
                    />
                  </div>
                )}
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

  const completedOrders = reservations.filter(r => r.status === 'completed').length;
  const activeOrders = reservations.filter(r => r.status !== 'completed').length;
  const co2Saved = Math.round((user.ecoPoints || 0) * 0.12);
  const moneySaved = (user.ecoPoints || 0) * 5;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-2">Consumer</p>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">
              Welcome back, {user.name} 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Your eco journey at a glance — every purchase makes a difference.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eco Score</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{user.ecoPoints}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'orders', label: `Your Orders (${reservations.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSearchParams(tab.key === 'overview' ? {} : { tab: tab.key })}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Eco Points', value: user.ecoPoints || 0, suffix: 'pts', icon: <Leaf size={18} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-900/50' },
                { label: 'CO₂ Saved', value: co2Saved, suffix: 'kg', icon: <Sparkles size={18} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-900/50' },
                { label: 'Money Saved', value: `₹${moneySaved.toLocaleString()}`, suffix: '', icon: <TrendingUp size={18} />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-900/50' },
                { label: 'Total Orders', value: reservations.length, suffix: '', icon: <ShoppingBag size={18} />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-900/50' },
              ].map((stat, i) => (
                <div key={i} className={`rounded-2xl border ${stat.border} ${stat.bg} p-5 transition-all hover:-translate-y-0.5`}>
                  <div className={`flex items-center gap-2 mb-3 ${stat.color}`}>
                    {stat.icon}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white">
                    {stat.value}{stat.suffix && <span className="text-sm font-bold text-slate-400 ml-1">{stat.suffix}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Eco Impact + Profile Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Eco Impact Card */}
              <div className="md:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
                <div className="absolute inset-0 dot-grid opacity-10" />
                <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <Leaf size={16} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/70">Your Impact</p>
                  </div>
                  <h3 className="text-3xl font-black mb-1">{user.ecoPoints || 0} <span className="text-lg font-bold text-white/60">eco points</span></h3>
                  <p className="text-sm text-white/60 mb-5">Every rescue earns points towards a greener planet.</p>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'CO₂ Avoided', value: `${co2Saved}kg` },
                      { label: 'Money Saved', value: `₹${moneySaved.toLocaleString()}` },
                      { label: 'Meals Rescued', value: reservations.length },
                    ].map((m, i) => (
                      <div key={i} className="rounded-2xl bg-white/10 backdrop-blur-sm p-3 text-center border border-white/10">
                        <p className="text-lg font-black">{m.value}</p>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Card */}
              <div className="md:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Profile</p>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-950 dark:text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Total Orders', value: reservations.length, color: 'text-slate-950 dark:text-white' },
                    { label: 'Active', value: activeOrders, color: 'text-amber-500' },
                    { label: 'Delivered', value: completedOrders, color: 'text-emerald-500' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                      <span className={`font-black ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action CTA */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-xl" />
              <div className="relative z-10">
                <h3 className="font-black text-emerald-800 dark:text-emerald-300 text-lg">Ready to save more food?</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Browse the marketplace to rescue surplus food near you!</p>
              </div>
              <a
                href="/#/marketplace"
                className="relative z-10 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-600/25 whitespace-nowrap"
              >
                <ShoppingBag size={16} /> Browse Marketplace
              </a>
            </div>
          </div>
        )}

        {/* Your Orders Tab */}
        {activeTab === 'orders' && (
          <OrdersAccordion reservations={reservations} viewer={user} loading={isLoading} />
        )}
      </div>

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
    </div>
  );
};




const CharityDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [donations, setDonations] = useState<Item[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isDonationsLoading, setIsDonationsLoading] = useState(true);
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
    setIsDonationsLoading(true);
    try {
      const allItems = await api.getItems();
      setDonations(allItems.filter((i) => !!i.forCharity && i.status === 'available' && i.quantity > 0));
    } finally {
      setIsDonationsLoading(false);
    }
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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-500 dark:text-rose-400 mb-2">Charity Portal</p>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Donation Hub</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Claim free surplus food and track your delivery requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Now</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{donations.length}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 mt-6">
          {[
            { key: 'overview', label: 'Available Donations' },
            { key: 'orders', label: `Your Claims (${reservations.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSearchParams(tab.key === 'overview' ? {} : { tab: tab.key })}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                  ? 'bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.25)]'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="mb-8">
            {isDonationsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                      <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-1/2" />
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : donations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No donations available right now</h3>
                <p className="text-slate-500">Check back soon — retailers add new donations throughout the day.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {donations.map((d) => (
                  <div key={d.id} className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800 hover:-translate-y-1 transition-all shadow-sm">
                    <div className="relative h-40 overflow-hidden">
                      <img src={d.image} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = '/custom-placeholder.png'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white">FREE DONATION</span>
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-bold text-white">{d.quantity} units</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-black text-slate-950 dark:text-white mb-1">{d.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{d.storeName} · Pickup by {d.pickupEnd}</p>
                      <button onClick={() => handleClaimDonation(d)} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-all">
                        Claim Donation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'orders' && (
          <OrdersAccordion reservations={reservations} viewer={user} loading={isLoading} />
        )}
      </div>

      <AlertPopup open={alertOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={() => setAlertOpen(false)} />
      <SuccessPopup open={successOpen} title="Donation Claimed!" message="Your claim has been submitted. A volunteer will deliver it shortly." onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

const VolunteerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [isAvailable, setIsAvailable] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deliveryConfirmTarget, setDeliveryConfirmTarget] = useState<{ taskId: string; code: string } | null>(null);
  const [deliveryConfirmLoading, setDeliveryConfirmLoading] = useState(false);
  const deliveryOtpInputRef = useRef<HTMLInputElement | null>(null);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
  const tasksRef = useRef<Task[]>([]);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ type: PopupType; title: string; message: string }>({ type: 'info', title: '', message: '' });

  const openAlert = (type: PopupType, title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertOpen(true);
  };

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setTimeout(() => {
        const el = document.getElementById(`task-${orderId}`) || document.querySelector(`[id^="task-"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTasks();
  }, []);

  // Keep tasksRef in sync so the geolocation watcher can read latest tasks
  // without restarting the watcher on every task reload.
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Live location tracking — starts once when there are active tasks and
  // does NOT restart when tasks reload (uses ref to read latest tasks).
  const hasActiveTasks = tasks.some(t => ['accepted', 'picked_up'].includes(t.status));
  useEffect(() => {
    if (!hasActiveTasks) return;

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    console.log('Starting live location tracking for active deliveries');

    // Watch position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        let effectiveLat = latitude;
        let effectiveLng = longitude;

        // If the live geolocation is extremely far (> 100 km) from the store,
        // it means the developer is testing the application remotely.
        // Let's use the volunteer's profile location (Connaught Place, Delhi) instead,
        // so that the distances are realistic (~3 km).
        const activeTasks = tasksRef.current.filter(t => ['accepted', 'picked_up'].includes(t.status));
        const targetLoc = (activeTasks[0] as any)?.storeLocation || (activeTasks[0] as any)?.dropLocation;
        if (targetLoc) {
          const rawDist = getHaversineDistance(latitude, longitude, targetLoc.lat, targetLoc.lng);
          if (rawDist > 100) {
            if (user.location && user.location.lat && user.location.lng) {
              const profileDist = getHaversineDistance(user.location.lat, user.location.lng, targetLoc.lat, targetLoc.lng);
              if (profileDist < 100) {
                effectiveLat = user.location.lat;
                effectiveLng = user.location.lng;
              }
            } else {
              // Mock a position near the store/drop
              effectiveLat = targetLoc.lat + 0.015;
              effectiveLng = targetLoc.lng - 0.015;
            }
          }
        }

        setCurrentLoc({ lat: effectiveLat, lng: effectiveLng });
        
        activeTasks.forEach((task) => {
          socket.emit('volunteer-location-update', {
            orderId: task.orderId,
            taskId: task.id,
            lat: effectiveLat,
            lng: effectiveLng,
            name: user.name || 'Volunteer',
          });
        });
      },
      (err) => {
        console.warn('Live tracking geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      console.log('Stopping live location tracking.');
      navigator.geolocation.clearWatch(watchId);
    };
  }, [hasActiveTasks, user.name]);
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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-600 dark:text-amber-400 mb-2">Volunteer</p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">Delivery Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pick up packed orders and deliver them to people in need.</p>
        </div>
        <button
          onClick={() => setIsAvailable(!isAvailable)}
          className={`relative inline-flex items-center gap-3 rounded-2xl px-5 py-3 font-bold text-sm transition-all ${isAvailable
              ? 'bg-emerald-600 text-white shadow-[0_0_24px_rgba(16,185,129,0.4)]'
              : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
          {isAvailable ? 'Online — Taking Pickups' : 'Go Online'}
        </button>
      </div>

      <div className="p-6">
        {!isAvailable ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-16 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Truck size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">You're offline</h3>
            <p className="text-slate-500 mb-6">Tap "Go Online" to see available food rescue pickups near you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Available Pickups ────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-950 dark:text-white">Available Pickups</h3>
                <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-xs font-black text-violet-700 dark:text-violet-300">
                  {tasks.filter(t => t.status === 'ready').length} ready
                </span>
              </div>
              {tasks.filter(t => t.status === 'ready').length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-400">
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Package size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">No pickups ready right now.</p>
                  <p className="text-xs mt-1">Check back in a few minutes.</p>
                </div>
              ) : tasks.filter(t => t.status === 'ready').map(task => (
                <div key={task.id} className="rounded-3xl border border-violet-500/20 bg-slate-50 dark:bg-slate-950 p-6 shadow-sm hover:border-violet-500/40 transition-all group">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[10px] font-black tracking-widest text-violet-500 uppercase">Available Task</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={12} /> +12 pts
                    </div>
                  </div>

                  <h4 className="text-lg font-black text-slate-950 dark:text-white mb-1">{task.weight} — Food Rescue</h4>
                  <p className="text-xs text-slate-400 mb-4">Pickup and deliver to charity partner</p>

                  {/* Route Timeline */}
                  <div className="space-y-0 mb-5 relative">
                    <div className="absolute left-[15px] top-8 bottom-8 w-px border-l-2 border-dashed border-slate-200 dark:border-slate-700" />

                    <div className="flex items-start gap-4 relative pb-4">
                      <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 border-2 border-slate-50 dark:border-slate-950 z-10 shadow">
                        <Package size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup From</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{task.storeName}</p>
                        <p className="text-xs text-slate-500 truncate">{task.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative">
                      <div className="h-8 w-8 rounded-full bg-rose-600 flex items-center justify-center shrink-0 border-2 border-slate-50 dark:border-slate-950 z-10 shadow">
                        <Leaf size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deliver To</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{task.charityName}</p>
                        <p className="text-xs text-slate-500 truncate">{task.dropAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Contents */}
                  {task.items && task.items.length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 mb-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Order Contents</p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.items.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Package size={10} className="text-slate-400" /> {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Info */}
                  {(() => {
                    const storeLoc = (task as any).storeLocation;
                    const dropLoc = (task as any).dropLocation;
                    const { distanceStr, timeStr } = formatDistanceAndTime(storeLoc, dropLoc);
                    return (
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Distance</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{distanceStr}</p>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Time</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{timeStr}</p>
                        </div>
                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Weight</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{task.weight || 'N/A'}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <button onClick={() => handleAccept(task.id)} className="w-full rounded-2xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-500 transition-all shadow-lg hover:shadow-violet-600/25 flex items-center justify-center gap-2">
                    Accept Pickup <CheckSquare size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* ── Active Tasks ────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-950 dark:text-white">Your Active Tasks</h3>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-3 py-1 text-xs font-black text-sky-700 dark:text-sky-300">
                  {tasks.filter(t => t.status === 'accepted' || t.status === 'picked_up').length} active
                </span>
              </div>
              {tasks.filter(t => t.status === 'accepted' || t.status === 'picked_up').length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-400">
                  <div className="flex justify-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <CheckSquare size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">No active deliveries.</p>
                  <p className="text-xs mt-1">Accept a pickup to get started.</p>
                </div>
              ) : tasks.filter(t => t.status === 'accepted' || t.status === 'picked_up').map(task => (
                <div 
                  key={task.id} 
                  id={`task-${task.id}`}
                  className={`rounded-3xl border p-6 shadow-sm transition-all duration-500 ${
                    searchParams.get('orderId') === task.orderId 
                      ? 'border-emerald-500 ring-4 ring-emerald-500/20' 
                      : ''
                  } ${task.status === 'picked_up'
                    ? 'border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-sky-500/20 bg-sky-50/30 dark:bg-sky-950/10'
                  }`}>
                  {/* Status Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${task.status === 'picked_up' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      <h4 className="font-black text-slate-950 dark:text-white text-sm">
                        {task.status === 'picked_up' ? 'In Transit — Delivering' : 'En Route — Heading to Store'}
                      </h4>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black text-white ${task.status === 'picked_up' ? 'bg-emerald-600' : 'bg-sky-600'}`}>
                      {task.status === 'picked_up' ? 'DELIVERING' : 'EN ROUTE'}
                    </span>
                  </div>

                  {/* Route Timeline */}
                  <div className="space-y-0 mb-5 relative">
                    <div className="absolute left-[15px] top-8 bottom-8 w-px border-l-2 border-dashed border-slate-200 dark:border-slate-700" />

                    <div className="flex items-start gap-4 relative pb-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 shadow ${task.status === 'picked_up' ? 'bg-emerald-600 border-emerald-50 dark:border-slate-950' : 'bg-sky-600 border-sky-50 dark:border-slate-950'}`}>
                        <Package size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pickup</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{task.storeName}</p>
                        <p className="text-xs text-slate-500 truncate">{task.pickupAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 relative">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 z-10 shadow ${task.status === 'picked_up' ? 'bg-rose-600 border-emerald-50 dark:border-slate-950' : 'bg-rose-400 border-sky-50 dark:border-slate-950'}`}>
                        <Leaf size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drop Off</p>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{task.charityName}</p>
                        <p className="text-xs text-slate-500 truncate">{task.dropAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Contents */}
                  {task.items && task.items.length > 0 && (
                    <div className="rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 mb-4">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Order Contents</p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.items.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <Package size={10} className="text-slate-400" /> {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta row */}
                  {(() => {
                    const storeLoc = (task as any).storeLocation;
                    const dropLoc = (task as any).dropLocation;
                    
                    const loc1 = currentLoc;
                    const loc2 = task.status === 'picked_up' ? dropLoc : storeLoc;
                    const label = task.status === 'picked_up' ? 'To Drop' : 'To Pick';
                    
                    // Only show real distance from volunteer's live location.
                    // If geolocation hasn't resolved yet, show "Locating..." instead
                    // of a misleading store-to-drop fallback.
                    const hasLoc = loc1 && loc2;
                    const { distanceStr, timeStr } = hasLoc
                      ? formatDistanceAndTime(loc1, loc2)
                      : { distanceStr: 'Locating…', timeStr: 'Locating…' };
                    
                    return (
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        <div className="rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Distance ({label})</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{distanceStr}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Est. Time</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{timeStr}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 text-center">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Weight</p>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{task.weight || 'N/A'}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Button */}
                  {task.status === 'accepted' ? (
                    <button onClick={() => handleUpdateTaskStatus(task.id, 'picked_up')} className="w-full rounded-2xl bg-sky-600 py-3 text-sm font-black text-white hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-600/25 flex items-center justify-center gap-2">
                      <CheckSquare size={16} /> Confirm Pickup — I have the order
                    </button>
                  ) : (
                    <button onClick={() => setDeliveryConfirmTarget({ taskId: task.id, code: '' })} className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-600/25 flex items-center justify-center gap-2">
                      <BadgeCheck size={16} /> Enter OTP to Complete Delivery
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
                          className={`flex h-16 items-center justify-center rounded-2xl border text-2xl font-black shadow-sm transition-all ${digit
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#020917] transition-colors">
      {user.role === 'retailer' && <RetailerDashboard user={user} />}
      {user.role === 'consumer' && <ConsumerDashboard user={user} />}
      {user.role === 'charity' && <CharityDashboard user={user} />}
      {user.role === 'volunteer' && <VolunteerDashboard user={user} />}
    </div>
  );
};
