import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Navigation, Mail, Phone, X } from 'lucide-react';
import { api } from '../services/mockBackend';
import { Charity } from '../types';

export const Charities: React.FC = () => {
  const [nearbyCharities, setNearbyCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);

  const findNearbyNGOs = async () => {
    setLocationStatus('locating');
    
    // Simulate geolocation delay
    setTimeout(async () => {
        try {
            const list = await api.getCharities();
            setNearbyCharities(list);
            setLocationStatus('found');
        } catch (e) {
            setLocationStatus('error');
        }
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-dark-950 transition-colors min-h-screen">
      
      {/* Hero */}
      <section className="bg-blue-600 text-white py-20 text-center px-4">
          <Heart size={60} className="mx-auto mb-6 text-blue-200" />
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Empower Your Charity</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Connect with local businesses to receive fresh surplus food donations. 
              Streamline logistics and focus on feeding those in need.
          </p>
      </section>

      {/* Feature: Find NGO */}
      <section className="py-16 max-w-5xl mx-auto px-4">
          <div className="bg-gray-50 dark:bg-dark-900 rounded-2xl p-8 border border-gray-100 dark:border-dark-800 text-center shadow-sm">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Looking for help? Find NGOs near you.</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Use your location to see registered charities distributing food in your area.
              </p>
              
              <button 
                onClick={findNearbyNGOs}
                disabled={locationStatus === 'locating'}
                className="bg-eco-600 text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 mx-auto hover:bg-eco-700 transition"
              >
                  {locationStatus === 'locating' ? (
                      <>Locating...</>
                  ) : (
                      <><Navigation size={20} /> Use My Location</>
                  )}
              </button>

              {/* Results Grid */}
              {locationStatus === 'found' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid md:grid-cols-3 gap-6 mt-12 text-left"
                  >
                      {nearbyCharities.map(charity => (
                          <div key={charity.id} className="bg-white dark:bg-dark-800 rounded-xl overflow-hidden shadow-sm border dark:border-dark-700">
                              <img src={charity.image} alt={charity.name} className="w-full h-32 object-cover" />
                              <div className="p-4">
                                  <h3 className="font-bold text-lg dark:text-white">{charity.name}</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{charity.mission}</p>
                                  <div className="flex items-center text-xs text-eco-600 dark:text-eco-400 gap-1 mb-4">
                                      <MapPin size={12} /> 1.2 km away
                                  </div>
                                  <button 
                                      onClick={() => setSelectedCharity(charity)}
                                      className="w-full border border-eco-600 text-eco-600 dark:text-eco-400 dark:border-eco-400 py-2 rounded-lg text-sm font-bold hover:bg-eco-50 dark:hover:bg-dark-700"
                                  >
                                      View Details
                                  </button>
                              </div>
                          </div>
                      ))}
                  </motion.div>
              )}
          </div>
      </section>

      {/* Charity Details Modal */}
      <AnimatePresence>
          {selectedCharity && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div 
                      initial={{opacity: 0, y: 20}}
                      animate={{opacity: 1, y: 0}}
                      exit={{opacity: 0, y: 20}}
                      className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative"
                  >
                      <button 
                        onClick={() => setSelectedCharity(null)}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10 transition"
                      >
                          <X size={20} />
                      </button>
                      
                      <div className="h-48 relative">
                          <img src={selectedCharity.image} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                              <h2 className="text-3xl font-bold text-white">{selectedCharity.name}</h2>
                          </div>
                      </div>

                      <div className="p-6">
                          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">{selectedCharity.mission}</p>
                          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                             {selectedCharity.description || "Dedicated to serving the local community through food rescue and redistribution efforts."}
                          </p>
                          
                          <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                  <Mail size={18} className="text-eco-600"/>
                                  <span>{selectedCharity.contact || "contact@charity.org"}</span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                  <Phone size={18} className="text-eco-600"/>
                                  <span>+1 (555) 123-4567</span>
                              </div>
                          </div>

                          <button className="w-full bg-eco-600 text-white py-3 rounded-xl font-bold hover:bg-eco-700 transition">
                              Contact Charity
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* Success Stories */}
      <section className="py-20 bg-white dark:bg-dark-950 px-4">
          <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Impact Stories</h2>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                      <img 
                        src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80" 
                        className="rounded-2xl shadow-xl w-full" 
                        alt="Volunteers"
                      />
                  </div>
                  <div>
                      <blockquote className="text-2xl font-light italic text-gray-700 dark:text-gray-300 mb-6">
                          "EcoFeast changed how we operate. We used to spend hours calling restaurants. Now, we just check the dashboard and pick up 50kg of quality food every week."
                      </blockquote>
                      <div className="font-bold dark:text-white">Sarah Johnson</div>
                      <div className="text-eco-600 dark:text-eco-400">Director, City Food Bank</div>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
};