import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Mail, MapPin, Send, CheckCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { fieldLabelClassName, inputClassName, textareaClassName } from '../components/ui';

const contactOptions = [
  { icon: '✉️', title: 'Email Us', detail: 'support@ecofeast.com', helper: 'For partnerships, support, or general questions', type: 'email' as const },
  { icon: '📍', title: 'Visit Us', detail: '123 Green Street, Sustainable City', helper: 'Our operations & collaboration hub', type: 'address' as const },
  { icon: '⏱️', title: 'Response Time', detail: 'Within 24 hours', helper: 'We respond to all messages promptly', type: 'info' as const },
];

const topics = ['General Inquiry', 'Partnership', 'Charity Onboarding', 'Technical Support', 'Media & Press', 'Other'];

export const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Paper plane animation state
  const [planePos, setPlanePos] = useState({ x: 0, y: 0 });
  const [planeLaunched, setPlaneLaunched] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const inView = useInView(formRef, { once: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlaneLaunched(true);

    try {
      await api.sendContactMessage(form.name, form.email, form.message);
      setTimeout(() => {
        setSent(true);
        setLoading(false);
        setPlaneLaunched(false);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Unable to send message right now. Please try again.');
      setLoading(false);
      setPlaneLaunched(false);
    }
  };

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO: MINIMALIST WITH FLOATING PLANE ─────────── */}
      <section
        className="relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8 min-h-[60vh] flex items-center"
        style={{ background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(16,185,129,0.18) 0%, transparent 55%)' }}
      >
        {/* Geometric lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[20, 40, 60, 80].map(pos => (
            <div key={pos} className="absolute h-px w-full bg-slate-200/40 dark:bg-white/5" style={{ top: `${pos}%` }} />
          ))}
          {[15, 35, 55, 75, 90].map(pos => (
            <div key={pos} className="absolute w-px h-full bg-slate-200/40 dark:bg-white/5" style={{ left: `${pos}%` }} />
          ))}
        </div>

        {/* Floating paper plane */}
        <motion.div
          className="pointer-events-none absolute text-4xl select-none"
          animate={planeLaunched ? {
            x: [0, 200, 600],
            y: [0, -100, -300],
            rotate: [0, -20, -45],
            opacity: [1, 1, 0],
          } : {
            x: [0, 15, 0],
            y: [0, -8, 0],
            rotate: [0, 5, 0],
          }}
          transition={planeLaunched ? { duration: 1.2, ease: 'easeIn' } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ right: '12%', top: '30%' }}
        >
          ✈️
        </motion.div>

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-400 mb-6">Get In Touch</p>
              <h1 className="text-[clamp(3rem,7vw,6rem)] font-black leading-none tracking-tight text-slate-950 dark:text-white mb-8">
                Let's talk<br />
                <span className="gradient-text-eco">food rescue.</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Whether you're building a partnership, joining as a charity, or just curious about how EcoFeast works — we're here.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONTACT OPTIONS ROW ──────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200/60 dark:border-white/5 bg-slate-50/60 dark:bg-white/2">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {contactOptions.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-5 rounded-3xl border border-slate-200/70 bg-white p-6 dark:border-white/8 dark:bg-white/3"
              >
                <div className="text-3xl shrink-0">{opt.icon}</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-1">{opt.title}</p>
                  <p className="font-black text-slate-950 dark:text-white">{opt.detail}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{opt.helper}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN FORM ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

            {/* Left column */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">Why Reach Out</p>
              <h2 className="text-4xl font-black text-slate-950 dark:text-white md:text-5xl mb-8 leading-tight">
                Real conversations,<br />
                real outcomes.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
                We're especially interested in hearing from retailers with surplus, charities needing logistics support, 
                and local organizers building food recovery programs.
              </p>

              {/* Topic quick-select */}
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">I want to talk about...</p>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => { setActiveTopic(topic); setForm(f => ({ ...f, topic })); }}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                        activeTopic === topic
                          ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-600'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-10 rounded-3xl overflow-hidden border border-slate-200/70 dark:border-white/8 h-48 relative bg-slate-100 dark:bg-white/3">
                <div className="absolute inset-0 dot-grid opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center gap-3 text-slate-500 dark:text-slate-600">
                  <MapPin size={20} className="text-emerald-500" />
                  <span className="font-bold">123 Green Street, Sustainable City</span>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div ref={formRef}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="rounded-[36px] border border-slate-200/70 bg-slate-50/60 p-8 dark:border-white/8 dark:bg-white/3 sm:p-10"
              >
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
                      >
                        <CheckCircle size={40} className="text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-3">Message Sent!</h3>
                      <p className="text-slate-600 dark:text-slate-300 mb-8">We'll get back to you within 24 hours.</p>
                      <button
                        onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); setActiveTopic(null); }}
                        className="rounded-2xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-500"
                      >
                        Send Another Message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form key="form" onSubmit={submit} className="space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                          <Send size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Message</p>
                          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Start the conversation</h2>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className={fieldLabelClassName}>Full Name</label>
                          <input
                            type="text" required value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className={inputClassName} placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className={fieldLabelClassName}>Email</label>
                          <input
                            type="email" required value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className={inputClassName} placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {activeTopic && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                          Topic: {activeTopic}
                        </div>
                      )}

                      <div>
                        <label className={fieldLabelClassName}>Message</label>
                        <textarea
                          rows={5} required value={form.message}
                          onChange={e => setForm({ ...form, message: e.target.value })}
                          className={textareaClassName}
                          placeholder="Tell us what you need help with, what you're building, or how you'd like to collaborate."
                        />
                      </div>

                      <button
                        disabled={loading}
                        className="group w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-bold text-white shadow-[0_0_30px_rgba(52,211,153,0.25)] transition-all hover:bg-emerald-500 hover:shadow-[0_0_50px_rgba(52,211,153,0.4)] hover:-translate-y-0.5 disabled:opacity-70"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>

                      {error && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
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
