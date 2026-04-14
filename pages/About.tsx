import React from 'react';
import { Target, Globe, Users } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-white dark:bg-dark-950 transition-colors">
      <section className="py-24 text-center px-4">
        <h1 className="text-5xl font-heading font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h1>
        <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          To build a world with <span className="text-eco-600 font-bold">Zero Food Waste</span> where every surplus meal feeds a person, not a landfill.
        </p>
      </section>

      <section className="py-16 bg-eco-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-eco-100 dark:bg-eco-900 rounded-full flex items-center justify-center text-eco-600 mb-4">
              <Target />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">The Problem</h3>
            <p className="text-gray-600 dark:text-gray-400">
              1/3 of all food produced is wasted. This accounts for major global greenhouse gas emissions.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 mb-4">
              <Globe />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">The Solution</h3>
            <p className="text-gray-600 dark:text-gray-400">
              A hyper-local platform connecting supply (stores) with demand (people and charities) in real time.
            </p>
          </div>
          <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-yellow-600 mb-4">
              <Users />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">The Community</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Powered by volunteers, eco-conscious consumers, and responsible businesses.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 dark:text-white">Founder</h2>
          <p className="text-xl font-semibold text-eco-600">Anubhav Akhil</p>
        </div>
      </section>
    </div>
  );
};

