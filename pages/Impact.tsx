import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, TrendingUp, Leaf, Users, Zap, BarChart3, Globe2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const bigStats = [
  { end: 2500000, display: '2.5M+', label: 'Meals Rescued', unit: '', icon: <ShoppingBag size={24} />, color: 'from-emerald-500 to-teal-500' },
  { end: 1200000, display: '1.2M', label: 'kg CO₂ Avoided', unit: 'kg', icon: <Leaf size={24} />, color: 'from-green-400 to-emerald-500' },
  { end: 4200, display: '4,200', label: 'Partner Stores', unit: '', icon: <TrendingUp size={24} />, color: 'from-violet-500 to-indigo-500' },
  { end: 500, display: '500+', label: 'Charity Partners', unit: '+', icon: <Users size={24} />, color: 'from-rose-500 to-pink-500' },
];

const impactAreas = [
  {
    icon: <Globe2 size={28} />,
    title: 'Environmental',
    headline: '1.2M kg of CO₂ kept out of the atmosphere.',
    points: ['Every rescue prevents landfill decomposition emissions', 'Reduces replacement food production demand', 'Supports measurable ESG reporting for partners'],
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconBg: 'bg-emerald-500',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Economic',
    headline: 'Consumers save 70%. Retailers recover costs.',
    points: ['Surplus turned into revenue instead of disposal cost', 'New customer discovery for partner businesses', 'Lower food spend for consumers and charities'],
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconBg: 'bg-violet-500',
  },
  {
    icon: <Users size={28} />,
    title: 'Social',
    headline: '500+ charities feeding more people, faster.',
    points: ['Faster access to quality donation-ready food', 'Volunteer network closing last-mile gaps', 'Stronger local food security infrastructure'],
    gradient: 'from-rose-500/10 to-pink-500/10',
    iconBg: 'bg-rose-500',
  },
];

function AnimatedCounter({ end, display }: { end: number; display: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(end);
    };
    requestAnimationFrame(animate);
  }, [inView, end]);

  const formatted = count >= 1000000
    ? (count / 1000000).toFixed(1) + 'M'
    : count >= 1000
      ? (count / 1000).toFixed(0) + (end === 4200 ? ',000' : 'k')
      : String(count);

  return (
    <div ref={ref} className="stat-glow text-[3.5rem] font-black leading-none tracking-tighter text-white md:text-[4.5rem]">
      {inView ? display : '0'}
    </div>
  );
}

export const Impact: React.FC = () => {
  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO: DARK CINEMATIC ─────────────────────────── */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden px-4 py-32 sm:px-6 lg:px-8"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.25) 0%, #020917 65%)' }}
      >
        {/* Animated rings */}
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/15"
            style={{ width: i * 280, height: i * 280, animation: `pulseRing ${2 + i}s ease-out infinite`, animationDelay: `${i * 0.7}s` }}
          />
        ))}

        <div className="ambient-orb left-[10%] top-1/4 h-96 w-96 bg-emerald-500/20" />
        <div className="ambient-orb animation-delay-2000 right-[5%] bottom-0 h-72 w-72 bg-teal-400/15" />

        <div className="relative z-10 mx-auto max-w-7xl w-full text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400 mb-6">Impact</p>
            <h1 className="text-[clamp(3rem,7vw,6.5rem)] font-black leading-none tracking-tight text-white mb-8">
              Numbers that<br />
              <span className="gradient-text-dark">actually matter.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300 leading-relaxed">
              Every rescue event creates a ripple of environmental, economic, and social impact. 
              Here's what the EcoFeast network has achieved together.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── BIG ANIMATED STATS ─────────────────────────────── */}
      <section className="py-4 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px bg-white/5 rounded-3xl overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
            {bigStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-slate-950 p-10 text-center hover:bg-slate-900 transition-colors"
              >
                <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <AnimatedCounter end={stat.end} display={stat.display} />
                <div className="mt-3 text-sm font-semibold text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARTH VISUAL ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            {/* Left text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400 mb-4">Climate Action</p>
              <h2 className="text-4xl font-black text-white md:text-5xl mb-6 leading-tight">
                1.2M kg of CO₂<br />
                <span className="gradient-text-eco">avoided and counting.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Food waste accounts for 8–10% of global greenhouse gas emissions. By rescuing 
                surplus food before it reaches landfills, EcoFeast directly reduces decomposition 
                methane emissions and replacement production demand.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Landfill methane', value: 95, color: 'bg-emerald-500' },
                  { label: 'Transport emissions', value: 72, color: 'bg-teal-500' },
                  { label: 'Production demand', value: 84, color: 'bg-green-500' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300 font-medium">{bar.label} reduced</span>
                      <span className="text-emerald-400 font-bold">{bar.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <motion.div
                        className={`h-full rounded-full ${bar.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: globe visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, type: 'spring' }}
              className="flex items-center justify-center"
            >
              <div className="relative h-72 w-72 md:h-96 md:w-96">
                {/* Glowing sphere */}
                <div className="animate-morph absolute inset-0 rounded-full bg-gradient-to-br from-emerald-600 to-teal-900 shadow-[0_0_100px_rgba(52,211,153,0.4)]" />
                {/* Grid lines on sphere */}
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400/20 overflow-hidden">
                  <div className="hero-grid absolute inset-0" style={{ backgroundSize: '32px 32px' }} />
                </div>
                {/* Orbiting dots */}
                {[0, 90, 180, 270].map(deg => (
                  <div key={deg} className="absolute inset-0" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  </div>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe2 size={64} className="text-white/60" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── IMPACT AREAS ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">Where Impact Shows Up</p>
            <h2 className="text-4xl font-black text-slate-950 dark:text-white md:text-5xl">
              One rescue.<br />Three kinds of impact.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {impactAreas.map((area, i) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`group rounded-3xl bg-gradient-to-br ${area.gradient} border border-slate-200/70 p-8 dark:border-white/8 hover:scale-[1.02] transition-transform`}
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${area.iconBg} text-white shadow-lg`}>
                  {area.icon}
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">{area.title}</p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white mb-5 leading-tight">{area.headline}</h3>
                <ul className="space-y-3">
                  {area.points.map(pt => (
                    <li key={pt} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center bg-slate-50/60 dark:bg-[#06111b]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Zap size={40} className="mx-auto mb-6 text-emerald-500" />
          <h2 className="text-3xl font-black text-slate-950 dark:text-white mb-4">Add your rescue to these numbers.</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
            Every order you place, every item donated, every pickup completed — it adds to a growing impact that compounds over time.
          </p>
          <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-[0_0_40px_rgba(52,211,153,0.3)] transition hover:bg-emerald-500 hover:-translate-y-1">
            Start Rescuing Food <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
};
