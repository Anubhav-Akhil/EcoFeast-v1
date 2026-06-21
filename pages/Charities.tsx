import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Navigation, Mail, Phone, ArrowRight, HandHeart, Truck, Users, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { Charity, UserRole } from '../types';
import { ModalHeader, ModalShell, primaryButtonClassName } from '../components/ui';

const howItWorks = [
  { icon: <CheckCircle size={22} />, title: 'Register your charity', body: 'Sign up and verify your organisation in minutes. No paperwork maze.' },
  { icon: <MapPin size={22} />, title: 'Discover nearby surplus', body: 'Browse donation-ready food from local retailers on your dashboard.' },
  { icon: <Truck size={22} />, title: 'Volunteers deliver', body: 'Our network of volunteers handles pickup and last-mile delivery for you.' },
  { icon: <Heart size={22} />, title: 'Feed more people', body: 'Focus on distribution — we handle the logistics of getting food to your door.' },
];

const testimonials = [
  {
    quote: 'EcoFeast changed how we operate. We used to spend hours calling restaurants. Now we just check the dashboard and pick up 50kg of quality food every week.',
    name: 'Sarah Johnson',
    role: 'Director, City Food Bank',
    avatar: '👩‍💼',
  },
  {
    quote: 'The volunteer coordination alone saved us 15 hours a week. We can now serve 40% more families with the same team.',
    name: 'Ravi Mehta',
    role: 'Operations Lead, Community Kitchen',
    avatar: '👨‍🍳',
  },
  {
    quote: 'What used to take days of planning now happens automatically. EcoFeast is the infrastructure layer our charity needed.',
    name: 'Priya Sharma',
    role: 'Co-founder, Hunger Relief Network',
    avatar: '👩‍🤝‍👩',
  },
];

interface CharitiesProps {
  onOpenAuth: (role: UserRole) => void;
}

export const Charities: React.FC<CharitiesProps> = ({ onOpenAuth }) => {
  const [nearbyCharities, setNearbyCharities] = useState<Charity[]>([]);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'found' | 'error'>('idle');
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const findNearbyNGOs = async () => {
    setLocationStatus('locating');
    setTimeout(async () => {
      try {
        const list = await api.getCharities();
        setNearbyCharities(list);
        setLocationStatus('found');
      } catch {
        setLocationStatus('error');
      }
    }, 1500);
  };

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO: WARM HUMAN-FIRST ──────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden px-4 sm:px-6 lg:px-8 py-24"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 0% 50%, rgba(244,63,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 100% 20%, rgba(251,146,60,0.10) 0%, transparent 50%), #ffffff' }}
      >
        <div className="dark:hidden absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 80% at 0% 50%, rgba(244,63,94,0.10) 0%, transparent 60%)' }} />
        <div className="hidden dark:block absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 0% 50%, rgba(190,18,60,0.20) 0%, transparent 55%), #020917' }} />

        {/* Floating hearts */}
        {[
          { left: '8%', top: '20%', size: 28, delay: 0, opacity: 0.3 },
          { left: '85%', top: '15%', size: 20, delay: 1, opacity: 0.2 },
          { left: '92%', top: '60%', size: 36, delay: 2, opacity: 0.15 },
          { left: '5%', top: '75%', size: 24, delay: 0.5, opacity: 0.25 },
          { left: '50%', top: '8%', size: 18, delay: 1.5, opacity: 0.2 },
        ].map((h, i) => (
          <div
            key={i}
            className="float-icon pointer-events-none absolute text-rose-500"
            style={{ left: h.left, top: h.top, '--dur': '8s', '--delay': `${h.delay}s`, opacity: h.opacity } as React.CSSProperties}
          >
            <Heart size={h.size} className="fill-current" />
          </div>
        ))}

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 mb-8 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                <Heart size={14} className="fill-current" />
                500+ charities supported
              </div>
              <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-none tracking-tight text-slate-950 dark:text-white mb-8">
                Feed more people.<br />
                <span className="text-rose-500">Do less admin.</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-10">
                EcoFeast connects your charity directly to donation-ready food from local businesses. 
                Volunteers handle pickup. You focus on the people who need you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onOpenAuth('charity')}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 font-bold text-white shadow-[0_0_40px_rgba(244,63,94,0.3)] transition-all hover:bg-rose-400 hover:shadow-[0_0_60px_rgba(244,63,94,0.4)] hover:-translate-y-1"
                >
                  Register Your Charity
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a href="/#/how-it-works?role=charity" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-rose-500 dark:hover:text-rose-300 hover:-translate-y-1">
                  How It Works
                </a>
              </div>
            </motion.div>

            {/* Impact card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="rounded-[32px] border border-rose-200/60 bg-gradient-to-br from-rose-50 to-orange-50 p-8 dark:border-rose-900/30 dark:from-rose-950/20 dark:to-orange-950/15"
            >
              <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-600 dark:text-rose-400 mb-6">Network Impact</p>
              <div className="space-y-5">
                {[
                  { icon: <Heart size={20} />, label: 'Meals donated', value: '2.5M+', color: 'bg-rose-500' },
                  { icon: <Users size={20} />, label: 'Charities served', value: '500+', color: 'bg-orange-500' },
                  { icon: <Truck size={20} />, label: 'Volunteer deliveries', value: '18K+', color: 'bg-amber-500' },
                  { icon: <HandHeart size={20} />, label: 'Communities reached', value: '200+', color: 'bg-rose-600' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.color} text-white`}>
                      {stat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-black text-slate-950 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
 
      {/* ── NGO DISCOVERY SECTION ────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#060c18]">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[40px] bg-white dark:bg-[#0d1526] p-10 md:p-16 border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Navigation size={120} />
            </div>
            
            <h2 className="text-3xl font-black text-slate-950 dark:text-white mb-4">Discover Active Partners</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md mx-auto">
              Find charities and NGOs operating in your neighborhood and see the impact they are making in real-time.
            </p>

            <button
              onClick={findNearbyNGOs}
              disabled={locationStatus === 'locating'}
              className="group relative inline-flex items-center gap-4 rounded-3xl bg-slate-950 px-12 py-6 text-xl font-black text-white transition-all hover:bg-slate-800 hover:-translate-y-1 disabled:opacity-70 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            >
              {locationStatus === 'locating' ? (
                <>
                  <div className="h-6 w-6 rounded-full border-3 border-slate-400 border-t-white animate-spin dark:border-slate-300 dark:border-t-slate-950" />
                  Locating NGOs...
                </>
              ) : (
                <>
                  <Navigation size={24} className="transition-transform group-hover:rotate-12" />
                  Find NGOs Near Me
                </>
              )}
            </button>

            {locationStatus === 'error' && (
              <p className="mt-4 text-sm font-bold text-rose-500">
                Unable to access location. Please try again.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── NGO FINDER RESULTS ────────────────────────────── */}
      <AnimatePresence>
        {locationStatus === 'found' && nearbyCharities.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="py-16 px-4 sm:px-6 lg:px-8 bg-rose-50/60 dark:bg-rose-950/10"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                  {nearbyCharities.length} NGOs found near you
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {nearbyCharities.map((charity, i) => (
                  <motion.div
                    key={charity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="group rounded-3xl bg-white dark:bg-dark-900 border border-rose-100 dark:border-rose-900/20 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    {charity.image && (
                      <div className="relative h-36 overflow-hidden">
                        <img src={charity.image} alt={charity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white text-xs font-bold">
                          <MapPin size={12} className="text-rose-300" /> 1.2 km away
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-black text-slate-950 dark:text-white mb-2">{charity.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-2">{charity.mission}</p>
                      <button
                        onClick={() => setSelectedCharity(charity)}
                        className="w-full rounded-2xl bg-rose-500 py-2.5 font-bold text-white text-sm transition hover:bg-rose-400"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-500 dark:text-rose-400 mb-4">Simple Onboarding</p>
            <h2 className="text-4xl font-black text-slate-950 dark:text-white md:text-5xl">Get food flowing in four steps.</h2>
          </div>
          <div className="grid gap-px bg-slate-200/60 dark:bg-white/5 rounded-3xl overflow-hidden md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white dark:bg-[#020917] p-8 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  {step.icon}
                </div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-[#06111b]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-500 dark:text-rose-400 mb-4">Testimonials</p>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Voices from the field.</h2>
          </div>
          <div className="relative rounded-[36px] border border-rose-200/60 bg-white p-10 dark:border-rose-900/30 dark:bg-dark-900/60 min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-6xl mb-6">{testimonials[activeTestimonial].avatar}</div>
                <blockquote className="text-xl font-light italic text-slate-700 dark:text-slate-200 mb-6 leading-relaxed">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>
                <div>
                  <div className="font-black text-slate-950 dark:text-white">{testimonials[activeTestimonial].name}</div>
                  <div className="text-rose-500 font-bold text-sm">{testimonials[activeTestimonial].role}</div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-rose-500' : 'w-2 bg-slate-200 dark:bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARITY DETAIL MODAL ─────────────────────────── */}
      <ModalShell open={!!selectedCharity} onClose={() => setSelectedCharity(null)} maxWidthClassName="max-w-xl" panelClassName="overflow-hidden" contentClassName="p-0">
        {selectedCharity && (
          <div>
            <div className="relative h-52">
              <img src={selectedCharity.image} className="h-full w-full object-cover" alt={selectedCharity.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h2 className="text-3xl font-black text-white">{selectedCharity.name}</h2>
              </div>
            </div>
            <div className="space-y-6 p-6">
              <ModalHeader
                title={selectedCharity.mission}
                description={selectedCharity.description || 'Dedicated to serving the local community through food rescue and redistribution efforts.'}
                eyebrow="Charity Profile"
              />
              <div className="space-y-3 rounded-[22px] border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-900/30 dark:bg-rose-950/15">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
                  <Mail size={18} className="text-rose-500" />
                  <span>{selectedCharity.contact || 'contact@charity.org'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
                  <Phone size={18} className="text-rose-500" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
              <button className={`w-full ${primaryButtonClassName} !bg-rose-500 hover:!bg-rose-400`}>
                Contact Charity
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
};
