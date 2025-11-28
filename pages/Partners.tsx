import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Leaf, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

interface PartnersProps {
    onOpenAuth: (role: UserRole) => void;
}

export const Partners: React.FC<PartnersProps> = ({ onOpenAuth }) => {
  return (
    <div className="bg-white dark:bg-dark-950 transition-colors">
      {/* Hero */}
      <section className="bg-eco-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-6xl font-heading font-bold mb-6"
            >
                Turn Waste into Revenue
            </motion.h1>
            <p className="text-xl text-eco-100 max-w-2xl mx-auto mb-10">
                Join 4,200+ businesses using EcoFeast to recover costs, attract new customers, and boost sustainability credentials.
            </p>
            <button 
                onClick={() => onOpenAuth('retailer')}
                className="bg-eco-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-eco-400 transition shadow-lg hover:shadow-eco-500/20"
            >
                Register Your Store
            </button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
                { icon: <TrendingUp size={40}/>, title: "Recover Sunk Costs", desc: "Sell surplus food instead of paying for disposal." },
                { icon: <Users size={40}/>, title: "New Customers", desc: "76% of EcoFeast users return to buy regular items." },
                { icon: <Leaf size={40}/>, title: "Zero Waste Certified", desc: "Get tangible CO2 impact reports for your ESG goals." }
            ].map((b, i) => (
                <div key={i} className="p-8 bg-gray-50 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-800 hover:shadow-xl transition duration-300">
                    <div className="text-eco-600 mb-4 flex justify-center">{b.icon}</div>
                    <h3 className="text-xl font-bold mb-2 dark:text-white">{b.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{b.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Case Study / Analytics Mockup */}
      <section className="bg-gray-50 dark:bg-dark-900 py-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Powerful Insights Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                      Our partner portal gives you real-time data on your waste reduction. Track revenue, predict expiry trends with AI, and manage inventory effortlessly.
                  </p>
                  <ul className="space-y-3">
                      {['Real-time sales tracking', 'AI Expiry Predictions', 'Automated tax deduction reports'].map(item => (
                          <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                              <ShieldCheck className="text-eco-500" size={20}/> {item}
                          </li>
                      ))}
                  </ul>
              </div>
              <div className="flex-1">
                  <div className="bg-white dark:bg-dark-800 p-4 rounded-xl shadow-2xl border border-gray-100 dark:border-dark-700">
                      {/* Mock Chart UI */}
                      <div className="flex justify-between items-center mb-6 border-b dark:border-dark-700 pb-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Saved</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">₹12,450</div>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded text-xs">+15% this month</div>
                      </div>
                      <div className="space-y-3">
                          <div className="h-8 bg-gray-100 dark:bg-dark-700 rounded w-3/4"></div>
                          <div className="h-8 bg-gray-100 dark:bg-dark-700 rounded w-full"></div>
                          <div className="h-8 bg-gray-100 dark:bg-dark-700 rounded w-5/6"></div>
                          <div className="h-8 bg-gray-100 dark:bg-dark-700 rounded w-1/2"></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
          <h2 className="text-3xl font-bold mb-6 dark:text-white">Ready to join the movement?</h2>
          <button 
             onClick={() => onOpenAuth('retailer')}
             className="bg-eco-600 text-white px-8 py-3 rounded-full font-bold hover:bg-eco-700 transition"
          >
              Sign Up as Partner
          </button>
      </section>
    </div>
  );
};