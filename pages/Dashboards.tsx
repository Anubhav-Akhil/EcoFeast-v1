import React, { useState, useEffect } from 'react';
import { User, Item, Reservation, Task } from '../types';
import { api } from '../services/mockBackend';
import { predictExpiryAndTags } from '../services/geminiService';
import { Plus, BarChart2, Package, Calendar, Camera, Leaf, Trash2, Star, CheckSquare, Square, MapPin, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
}

// --- RETAILER DASHBOARD ---
const RetailerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Form State
  const [newItem, setNewItem] = useState<Partial<Item>>({
    title: '', originalPrice: 0, discountPrice: 0, category: 'meals', quantity: 1, tags: [], forAnimalFeed: false
  });

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    const all = await api.getItems();
    // Filter by storeId or simulate via name for mock
    setItems(all.filter(i => i.storeName === user.organizationName || i.storeId === user.id));
  };

  const handleAiAnalysis = async () => {
    if (!newItem.title) return;
    setAiLoading(true);
    const result = await predictExpiryAndTags(newItem.title!, newItem.category || 'grocery');
    setNewItem(prev => ({
       ...prev, 
       tags: result.tags,
       expiry: new Date(Date.now() + result.expiryHours * 3600000).toISOString()
    }));
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(newItem.title) {
        await api.addItem({
            ...newItem,
            storeId: user.id,
            storeName: user.organizationName || 'My Store',
            pickupStart: '10:00', pickupEnd: '20:00',
            image: 'https://picsum.photos/400/300', // Mock upload
            category: newItem.forAnimalFeed ? 'compost' : newItem.category
        } as any);
        setShowAdd(false);
        loadStoreData();
    }
  };

  const handleDelete = async (id: string) => {
      if (confirm('Are you sure you want to remove this listing?')) {
          await api.deleteItem(id);
          loadStoreData();
      }
  };

  const stats = [
    { label: 'Revenue Saved', value: '₹12,450', color: 'bg-green-100 text-green-700' },
    { label: 'Meals Rescued', value: '342', color: 'bg-blue-100 text-blue-700' },
    { label: 'Credit Points', value: user.creditPoints || 50, color: 'bg-yellow-100 text-yellow-700' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold dark:text-white">Retailer Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400">Manage surplus and track impact</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-eco-600 text-white px-4 py-2 rounded-lg hover:bg-eco-700">
          <Plus size={18} /> Add Surplus
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s, i) => (
          <div key={i} className={`p-6 rounded-xl ${s.color}`}>
            <div className="text-sm font-semibold opacity-80">{s.label}</div>
            <div className="text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Listings */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
          <h3 className="font-bold mb-4 dark:text-white">Active Listings</h3>
          <div className="space-y-4">
            {items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 border dark:border-dark-700 rounded-lg">
                    <div className="flex gap-4">
                        <img src={item.image} className="w-16 h-16 rounded-md object-cover" />
                        <div>
                            <div className="font-bold dark:text-white">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.quantity} left • Ends {item.pickupEnd}</div>
                            {item.forAnimalFeed && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Animal Feed</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {item.status === 'available' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                        ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">{item.status}</span>
                        )}
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete Item">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>
            ))}
            {items.length === 0 && <div className="text-gray-500 text-center py-8">No active listings.</div>}
          </div>
        </div>

        {/* Analytics (Mock) */}
        <div className="bg-white dark:bg-dark-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
            <h3 className="font-bold mb-4 dark:text-white">Weekly Impact</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        {name: 'M', value: 10}, {name: 'T', value: 25}, {name: 'W', value: 15},
                        {name: 'T', value: 30}, {name: 'F', value: 45}, {name: 'S', value: 20}
                    ]}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                        <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Tip:</strong> Donate items for free to earn 10 Credit Points per item! High Credit Points increase your store ranking.
            </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-900 p-8 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 dark:text-white">List New Surplus</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Item Name</label>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" 
                                value={newItem.title} 
                                onChange={e => setNewItem({...newItem, title: e.target.value})} 
                                placeholder="e.g. Assorted Bagels"
                            />
                            <button 
                                type="button" 
                                onClick={handleAiAnalysis}
                                disabled={aiLoading || !newItem.title}
                                className="bg-purple-100 text-purple-700 p-2 rounded hover:bg-purple-200"
                                title="Auto-fill with AI"
                            >
                                {aiLoading ? '...' : <Camera size={20}/>}
                            </button>
                        </div>
                    </div>
                    
                    {/* Animal Feed Checkbox */}
                    <div 
                        className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer border border-orange-100 dark:border-orange-800"
                        onClick={() => setNewItem({...newItem, forAnimalFeed: !newItem.forAnimalFeed})}
                    >
                        <div className={`mt-0.5 ${newItem.forAnimalFeed ? 'text-orange-600' : 'text-gray-400'}`}>
                            {newItem.forAnimalFeed ? <CheckSquare size={20} /> : <Square size={20} />}
                        </div>
                        <div>
                             <span className="block text-sm font-bold text-gray-800 dark:text-gray-200">Not fit for humans?</span>
                             <span className="text-xs text-gray-600 dark:text-gray-400">Mark for Animal Feed or Composting.</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Original Price (₹)</label>
                            <input type="number" className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" value={newItem.originalPrice} onChange={e=>setNewItem({...newItem, originalPrice: +e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Discount Price (₹)</label>
                            <input type="number" className="w-full border p-2 rounded dark:bg-dark-800 dark:border-dark-700 dark:text-white" value={newItem.discountPrice} onChange={e=>setNewItem({...newItem, discountPrice: +e.target.value})} />
                            {newItem.discountPrice === 0 && (
                                <p className="text-xs text-green-600 mt-1 font-bold">+ Earn Credit Points!</p>
                            )}
                         </div>
                    </div>
                    {newItem.tags && newItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs">
                            {newItem.tags.map(t => <span key={t} className="bg-eco-100 text-eco-700 px-2 py-1 rounded">{t}</span>)}
                        </div>
                    )}
                    <button type="submit" className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold hover:bg-eco-700">Post Listing</button>
                    <button type="button" onClick={() => setShowAdd(false)} className="w-full text-gray-500 py-2 hover:text-gray-700">Cancel</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

// --- CONSUMER DASHBOARD ---
const ConsumerDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        api.getUserReservations(user.id).then(setReservations);
    }, [user.id]);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Welcome back, {user.name}!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">You've saved 12 meals this month.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="font-bold text-lg dark:text-white">Your Orders</h3>
                    {reservations.length === 0 ? (
                        <div className="p-8 border-2 border-dashed dark:border-gray-700 rounded-xl text-center text-gray-400">
                            No active orders. <br/> Go save some food!
                        </div>
                    ) : (
                        reservations.map(res => (
                            <div key={res.id} className="bg-white dark:bg-dark-900 p-4 rounded-xl shadow-sm border border-eco-200 dark:border-dark-800 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-eco-600 dark:text-eco-400 font-bold uppercase mb-1">Ready for pickup</div>
                                    <div className="font-bold text-gray-900 dark:text-white">Order #{res.code}</div>
                                    <div className="text-sm text-gray-500">
                                        {res.items ? `${res.items.length} items` : '1 Item'} • Total: ₹{res.totalAmount || 0}
                                    </div>
                                </div>
                                <div className="h-12 w-12 bg-eco-100 dark:bg-eco-900 rounded-full flex items-center justify-center text-eco-700 dark:text-eco-400">
                                    <Package size={24}/>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-4 dark:text-white">Your Eco Impact</h3>
                    <div className="bg-gradient-to-br from-eco-500 to-teal-600 rounded-2xl p-6 text-white text-center">
                        <div className="inline-block p-4 bg-white/20 rounded-full mb-4">
                            <Leaf size={32} />
                        </div>
                        <div className="text-5xl font-bold mb-2">{user.ecoPoints}</div>
                        <div className="text-eco-100 font-medium mb-6">Eco Points Earned</div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 text-sm">
                            <div>
                                <div className="font-bold text-xl">15kg</div>
                                <div className="text-eco-200">CO2 Saved</div>
                            </div>
                            <div>
                                <div className="font-bold text-xl">₹3,500</div>
                                <div className="text-eco-200">Money Saved</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CHARITY DASHBOARD ---
const CharityDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [donations, setDonations] = useState<Item[]>([]);

    useEffect(() => {
        const fetchDonations = async () => {
            const allItems = await api.getItems();
            // Free items (price 0) are donations
            setDonations(allItems.filter(i => i.discountPrice === 0 && i.status === 'available'));
        }
        fetchDonations();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Charity Dashboard</h2>
            
            <div className="mb-8">
                 <h3 className="text-xl font-bold mb-4 dark:text-white text-eco-600">Available Donations</h3>
                 {donations.length === 0 ? (
                     <div className="bg-white dark:bg-dark-900 p-8 rounded-xl text-center text-gray-500 border dark:border-dark-800">
                         No free donations available at the moment. Check back later!
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {donations.map(d => (
                             <div key={d.id} className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border border-eco-200 dark:border-dark-800 hover:shadow-md transition">
                                 <div className="flex justify-between items-start mb-3">
                                     <h4 className="font-bold text-lg dark:text-white">{d.title}</h4>
                                     <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">FREE</span>
                                 </div>
                                 <p className="text-sm text-gray-500 mb-3">{d.storeName}</p>
                                 <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                     <Package size={16}/> {d.quantity} units • <Calendar size={16}/> {d.pickupEnd}
                                 </div>
                                 <button className="w-full bg-eco-600 text-white py-2 rounded-lg font-bold hover:bg-eco-700">
                                     Claim Donation
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
};

// --- VOLUNTEER DASHBOARD ---
const VolunteerDashboard: React.FC<{ user: User }> = ({ user }) => {
    const [isAvailable, setIsAvailable] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const t = await api.getTasks();
        setTasks(t);
    };

    const handleAccept = async (id: string) => {
        await api.updateTaskStatus(id, 'accepted');
        loadTasks();
    };

    const handleComplete = async (id: string) => {
        await api.updateTaskStatus(id, 'completed');
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
                    <Truck size={48} className="mx-auto mb-4 text-gray-400"/>
                    <h3 className="text-lg font-bold mb-2 dark:text-white">You are currently offline</h3>
                    <p className="text-gray-500">Switch your status to "Online" to see available pickup tasks.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pending Tasks */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg dark:text-white border-b pb-2">Available Pickups</h3>
                        {tasks.filter(t => t.status === 'pending').length === 0 && <p className="text-gray-500">No tasks nearby.</p>}
                        {tasks.filter(t => t.status === 'pending').map(task => (
                            <div key={task.id} className="bg-white dark:bg-dark-900 p-5 rounded-xl shadow-sm border dark:border-dark-800">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-eco-600">{task.weight} Food Rescue</span>
                                </div>
                                <div className="space-y-3 mb-4 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="flex gap-2">
                                        <div className="w-1 bg-green-500 rounded-full"></div>
                                        <div>
                                            <div className="text-xs text-gray-400">PICKUP</div>
                                            <div className="font-semibold">{task.storeName}</div>
                                            <div className="text-xs">{task.pickupAddress}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1 bg-blue-500 rounded-full"></div>
                                        <div>
                                            <div className="text-xs text-gray-400">DROP OFF</div>
                                            <div className="font-semibold">{task.charityName}</div>
                                            <div className="text-xs">{task.dropAddress}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-dark-800 p-2 rounded text-xs">
                                        Content: {task.itemsSummary}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAccept(task.id)} className="flex-1 bg-eco-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-eco-700">Accept</button>
                                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Decline</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Tasks */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg dark:text-white border-b pb-2">Your Active Tasks</h3>
                        {tasks.filter(t => t.status === 'accepted').length === 0 && <p className="text-gray-500">No active deliveries.</p>}
                        {tasks.filter(t => t.status === 'accepted').map(task => (
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
        </div>
    );
};

// --- MAIN WRAPPER ---
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