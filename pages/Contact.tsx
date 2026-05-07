import React, { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../services/api';
import { fieldLabelClassName, inputClassName, primaryButtonClassName, textareaClassName } from '../components/ui';

export const Contact: React.FC = () => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            await api.sendContactMessage(form.name, form.email, form.message);
            setStatus('Message sent successfully. We will contact you soon.');
            setForm({ name: '', email: '', message: '' });
        } catch (error: any) {
            setStatus(error?.message || 'Unable to send message right now.');
        } finally {
            setLoading(false);
        }
    };

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
                    <form className="space-y-4" onSubmit={submit}>
                        <div>
                            <label className={fieldLabelClassName}>Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={inputClassName}
                                placeholder="Your full name"
                            />
                        </div>
                        <div>
                            <label className={fieldLabelClassName}>Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className={inputClassName}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className={fieldLabelClassName}>Message</label>
                            <textarea
                                rows={5}
                                required
                                value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                className={textareaClassName}
                                placeholder="Tell us how we can help."
                            ></textarea>
                        </div>
                        <button
                            disabled={loading}
                            className={`w-full ${primaryButtonClassName}`}
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                        {status && <p className="text-sm text-gray-600 dark:text-gray-300">{status}</p>}
                    </form>
                </div>
            </section>
        </div>
    );
};
