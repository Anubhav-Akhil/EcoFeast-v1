import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Contact: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-dark-950 transition-colors">
            <section className="py-20 bg-eco-900 text-white text-center">
                <h1 className="text-4xl font-heading font-bold mb-4">Get in Touch</h1>
                <p className="text-eco-200">We'd love to hear from you. Questions? Partnerships? Feedback?</p>
            </section>
            
            <section className="py-16 max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold dark:text-white">Contact Information</h2>
                    <div className="flex items-start gap-4">
                        <MapPin className="text-eco-600 mt-1" />
                        <div>
                            <h3 className="font-bold dark:text-white">Office</h3>
                            <p className="text-gray-600 dark:text-gray-400">123 Green Street, Sustainable City, EcoLand 54321</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Mail className="text-eco-600 mt-1" />
                        <div>
                            <h3 className="font-bold dark:text-white">Email</h3>
                            <p className="text-gray-600 dark:text-gray-400">support@ecofeast.com</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <Phone className="text-eco-600 mt-1" />
                        <div>
                            <h3 className="font-bold dark:text-white">Phone</h3>
                            <p className="text-gray-600 dark:text-gray-400">+1 (555) 000-9999</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-dark-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-dark-800">
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label>
                            <input type="text" className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
                            <input type="email" className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Message</label>
                            <textarea rows={4} className="w-full border p-3 rounded-lg dark:bg-dark-800 dark:border-dark-700 dark:text-white"></textarea>
                        </div>
                        <button className="w-full bg-eco-600 text-white py-3 rounded-lg font-bold hover:bg-eco-700">Send Message</button>
                    </form>
                </div>
            </section>
        </div>
    );
};