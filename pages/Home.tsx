import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Truck, ArrowRight, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-eco-50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-eco-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-heading font-bold text-gray-900 leading-tight mb-6"
            >
              Save Food. <span className="text-eco-600">Save Money.</span> <span className="text-teal-600">Save the Planet.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10"
            >
              Join the #1 marketplace for surplus food. Connect with local stores to rescue delicious meals at 70% off.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link to="/marketplace" className="px-8 py-4 bg-eco-600 text-white rounded-full font-semibold text-lg hover:bg-eco-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Rescuing Food
              </Link>
              <Link to="/partners" className="px-8 py-4 bg-white text-eco-700 border-2 border-eco-100 rounded-full font-semibold text-lg hover:border-eco-600 transition shadow-sm">
                Add Your Store
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Three simple steps to fight food waste.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <ShoppingBag size={40} />, title: "Businesses List Surplus", desc: "Stores upload unsold food at a discount or for donation." },
              { icon: <Heart size={40} />, title: "You Reserve It", desc: "Consumers and charities find nearby deals and book them instantly." },
              { icon: <Truck size={40} />, title: "Pickup or Delivery", desc: "Collect your bag at the specified time or get it delivered." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05 }}
                className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-eco-50 transition border border-gray-100"
              >
                <div className="bg-white w-20 h-20 mx-auto rounded-full flex items-center justify-center text-eco-600 shadow-md mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-eco-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
             {[
               { val: "2.5M+", label: "Meals Rescued", icon: <ShoppingBag className="mx-auto mb-2 opacity-70"/> },
               { val: "4,200", label: "Partner Stores", icon: <TrendingUp className="mx-auto mb-2 opacity-70"/> },
               { val: "1.2M kg", label: "CO₂ Saved", icon: <ArrowRight className="mx-auto mb-2 opacity-70 rotate-[-45deg]"/> },
               { val: "500+", label: "Charities Helper", icon: <Users className="mx-auto mb-2 opacity-70"/> }
             ].map((stat, i) => (
               <div key={i} className="p-4">
                 {stat.icon}
                 <div className="text-4xl font-bold mb-1 text-eco-300">{stat.val}</div>
                 <div className="text-eco-100 text-sm uppercase tracking-wider">{stat.label}</div>
               </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};