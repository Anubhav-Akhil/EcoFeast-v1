import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Mail, MapPin, Clock, Send, CheckCircle, ArrowRight, Phone, Users, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { fieldLabelClassName, inputClassName, textareaClassName } from '../components/ui';

const contactInfo = [
  {
    icon: <Mail size={20} />,
    label: 'Email',
    value: 'support@ecofeast.com',
    sub: 'For partnerships, support & general queries',
  },
  {
    icon: <Phone size={20} />,
    label: 'Phone',
    value: '+91 98765 43210',
    sub: 'Weekdays 9 AM – 6 PM IST',
  },
  {
    icon: <MapPin size={20} />,
    label: 'Location',
    value: 'Bangalore, India',
    sub: 'Operations & collaboration hub',
  },
  {
    icon: <Clock size={20} />,
    label: 'Response Time',
    value: 'Within 24 hours',
    sub: 'We read every message personally',
  },
];

const topics = [
  { icon: <Users size={16} />, label: 'Partnership' },
  { icon: <MessageSquare size={16} />, label: 'General Query' },
  { icon: <Mail size={16} />, label: 'Charity Onboarding' },
  { icon: <Phone size={16} />, label: 'Technical Support' },
];

export const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const inView = useInView(formRef, { once: true, margin: '-60px' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.sendContactMessage(form.name, form.email, form.message);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to send message right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-0 pt-24 sm:px-6 lg:px-8"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(16,185,129,0.15) 0%, transparent 55%)' }}
      >
        <div className="dot-grid absolute inset-0 opacity-30 dark:opacity-20" />
        <div className="relative z-10 mx-auto max-w-3xl pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400 mb-5">
              Contact Us
            </p>
            <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-black leading-none tracking-tight text-slate-950 dark:text-white mb-6">
              We'd love to<br />
              <span className="gradient-text-eco">hear from you.</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
              Whether you're a retailer looking to partner, a charity wanting to onboard, or simply curious — our team is ready to talk.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT INFO ROW ─────────────────────────────── */}
      <section className="border-y border-slate-200/70 bg-slate-50/60 px-4 py-10 dark:border-white/5 dark:bg-slate-900/40 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{item.label}</p>
                  <p className="mt-0.5 font-bold text-slate-950 dark:text-white text-sm">{item.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:items-start">

            {/* LEFT SIDEBAR */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">
                Get In Touch
              </p>
              <h2 className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl mb-5 leading-tight">
                Real people,<br />real conversations.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
                We especially want to hear from retailers with surplus inventory, charities needing food logistics, and local volunteers ready to make an impact.
              </p>

              {/* What to expect */}
              <div className="space-y-4">
                {[
                  { icon: <Clock size={18} />, title: 'Fast response', body: 'We aim to reply within 24 hours on all messages.' },
                  { icon: <Users size={18} />, title: 'Real collaboration', body: 'Not a bot — a real person from the EcoFeast team.' },
                  { icon: <CheckCircle size={18} />, title: 'Action-oriented', body: 'Every message gets routed to the right person immediately.' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.45 }}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 dark:text-white">{item.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{item.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* RIGHT FORM */}
            <div ref={formRef}>
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-slate-200 bg-slate-50/60 p-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10"
              >
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
                      >
                        <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-2">Message Sent!</h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm">
                        Thanks for reaching out. We'll get back to you within 24 hours.
                      </p>
                      <button
                        onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); setActiveTopic(null); }}
                        className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
                      >
                        Send Another Message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={submit} className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-slate-700/60">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0">
                          <Send size={18} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">New Message</p>
                          <h2 className="text-xl font-black text-slate-950 dark:text-white">Start a conversation</h2>
                        </div>
                      </div>

                      {/* Topic pills */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">I'm reaching out about…</p>
                        <div className="flex flex-wrap gap-2">
                          {topics.map(t => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => { setActiveTopic(t.label); setForm(f => ({ ...f, topic: t.label })); }}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                                activeTopic === t.label
                                  ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:text-emerald-300'
                              }`}
                            >
                              {t.icon} {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name + Email */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className={fieldLabelClassName}>Full Name</label>
                          <input
                            type="text" required value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className={inputClassName}
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className={fieldLabelClassName}>Email Address</label>
                          <input
                            type="email" required value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className={inputClassName}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className={fieldLabelClassName}>Message</label>
                        <textarea
                          rows={5} required value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          className={textareaClassName}
                          placeholder="Tell us what you need help with, what you're building, or how you'd like to collaborate."
                        />
                      </div>

                      {/* Submit */}
                      <button
                        disabled={loading}
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            Send Message
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                          {error}
                        </div>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
