import React from 'react';
import { TrendingUp, Users, Leaf, ShoppingBag } from 'lucide-react';

export const Impact: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-dark-950 transition-colors">
            <section className="py-20 text-center px-4">
                <h1 className="text-5xl font-heading font-bold mb-6 text-gray-900 dark:text-white">Our Impact</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">Transparency is key to our mission.</p>
            </section>
            
            <section className="pb-20 px-4 max-w-7xl mx-auto">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     {[
                       { val: "2.5M+", label: "Meals Rescued", icon: <ShoppingBag className="mx-auto mb-2 text-eco-600"/> },
                       { val: "4,200", label: "Partner Stores", icon: <TrendingUp className="mx-auto mb-2 text-eco-600"/> },
                       { val: "1.2M kg", label: "CO₂ Saved", icon: <Leaf className="mx-auto mb-2 text-eco-600"/> },
                       { val: "500+", label: "Charities", icon: <Users className="mx-auto mb-2 text-eco-600"/> }
                     ].map((stat, i) => (
                       <div key={i} className="p-8 bg-eco-50 dark:bg-dark-900 rounded-xl text-center">
                         {stat.icon}
                         <div className="text-4xl font-bold mb-1 dark:text-white">{stat.val}</div>
                         <div className="text-sm uppercase tracking-wider text-gray-500">{stat.label}</div>
                       </div>
                     ))}
                 </div>
            </section>
        </div>
    );
};