import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Leaf, ShieldCheck, Zap, ArrowRight, BarChart3, BadgeCheck } from 'lucide-react';
import { UserRole } from '../types';

interface PartnersProps {
  onOpenAuth: (role: UserRole) => void;
}

const benefits = [
  {
    icon: <TrendingUp size={28} />,
    title: 'Recover Sunk Costs',
    body: 'Sell surplus food instead of paying for disposal. Turn waste-spend into revenue stream.',
    stat: '₹12K+',
    statLabel: 'avg. monthly recovery per store',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    icon: <Users size={28} />,
    title: 'New Customers',
    body: '76% of EcoFeast users return to buy at full price. Rescue bags are your best marketing.',
    stat: '76%',
    statLabel: 'return-to-full-price rate',
    color: 'from-violet-600 to-purple-600',
  },
  {
    icon: <Leaf size={28} />,
    title: 'ESG Credentials',
    body: 'Get tangible CO₂ impact reports and zero-waste certifications for your sustainability reports.',
    stat: '0kg',
    statLabel: 'target disposal waste',
    color: 'from-green-500 to-emerald-600',
  },
];

const features = [
  { icon: <Zap size={20} />, label: 'Real-time listing' },
  { icon: <BarChart3 size={20} />, label: 'AI expiry predictions' },
  { icon: <ShieldCheck size={20} />, label: 'Automated tax reports' },
  { icon: <BadgeCheck size={20} />, label: 'Zero-waste badge' },
  { icon: <Users size={20} />, label: 'Volunteer logistics' },
  { icon: <TrendingUp size={20} />, label: 'Revenue analytics' },
];

const steps = [
  { n: '01', title: 'List your surplus', body: 'Upload excess inventory with quantities, pricing, and pickup windows in under 2 minutes.' },
  { n: '02', title: 'Reach buyers instantly', body: 'Your listing goes live to thousands of nearby consumers, charities, and volunteers.' },
  { n: '03', title: 'Coordinate pickup', body: 'Real-time status tracking for every order. Zero phone calls, zero confusion.' },
  { n: '04', title: 'Measure your impact', body: 'Get weekly impact reports showing revenue recovered, CO₂ saved, and meals rescued.' },
];

export const Partners: React.FC<PartnersProps> = ({ onOpenAuth }) => {
  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO: BRUTALIST DARK ─────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#020917]"
      >
        {/* Neon grid lines */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(52,211,153,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Orbs */}
        <div className="ambient-orb left-[15%] top-20 h-96 w-96 bg-emerald-500/25" />
        <div className="ambient-orb animation-delay-4000 right-[5%] bottom-10 h-80 w-80 bg-teal-400/15" />



        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300 mb-8">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                4,200+ partners active on the network
              </div>
              <h1 className="text-[clamp(3rem,6vw,6rem)] font-black leading-none tracking-tight text-slate-900 dark:text-white mb-8">
                Turn waste<br />
                <span className="gradient-text-eco">into revenue.</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-10">
                Join thousands of retailers using EcoFeast to recover costs from surplus inventory, 
                attract new customers, and build genuine sustainability credentials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onOpenAuth('retailer')}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 font-bold text-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.35)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_60px_rgba(52,211,153,0.55)] hover:-translate-y-1"
                >
                  Register Your Store
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a 
                  href="/#/how-it-works?role=partner"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/15 px-8 py-4 font-bold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-white/5 hover:-translate-y-1"
                >
                  How It Works
                </a>
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="neon-border rounded-3xl bg-white dark:bg-[#0d1f12] border border-slate-200 dark:border-emerald-500/20 p-6 overflow-hidden shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex gap-1.5">
                  {['bg-rose-500', 'bg-amber-500', 'bg-emerald-500'].map(c => (
                    <div key={c} className={`h-3 w-3 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="text-xs text-emerald-400 font-mono">ecofeast — partner dashboard</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Revenue Recovered', value: '₹12,450', delta: '+15%', color: 'text-emerald-400' },
                  { label: 'Items Listed', value: '48', delta: '+8', color: 'text-emerald-400' },
                  { label: 'CO₂ Saved', value: '240kg', delta: 'this week', color: 'text-teal-400' },
                  { label: 'Orders Fulfilled', value: '127', delta: '100% pickup', color: 'text-violet-400' },
                ].map(m => (
                  <div key={m.label} className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5">
                    <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                    <p className={`text-xl font-black text-slate-900 dark:text-white`}>{m.value}</p>
                    <p className={`text-xs font-bold ${m.color}`}>{m.delta}</p>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5">
                <p className="text-xs text-slate-500 mb-3">Weekly rescue volume</p>
                <div className="flex items-end gap-2 h-16">
                  {[40, 65, 45, 80, 70, 90, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                      className="flex-1 rounded-t bg-emerald-500/60"
                      style={{ height: `${h}%`, transformOrigin: 'bottom' }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                    <span key={d} className="text-[10px] text-slate-600 flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS GRID ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">Why Partners Choose EcoFeast</p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white md:text-5xl">The numbers speak.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/8 bg-white dark:bg-white/3 p-8 hover:border-emerald-500/30 transition-all shadow-sm"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${b.color} text-white shadow-lg`}>
                  {b.icon}
                </div>
                <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{b.stat}</div>
                <div className="text-xs font-bold text-slate-500 mb-5">{b.statLabel}</div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{b.title}</h3>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{b.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#06111b]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">Partner Onboarding</p>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white md:text-5xl">Up and running<br />in four steps.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-3xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-7"
              >
                <div className="text-[3.5rem] font-black text-slate-200 dark:text-white/6 select-none leading-none mb-4">{step.n}</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES PILL LIST ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-6">What You Get</p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {features.map(f => (
              <div key={f.label} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-bold text-emerald-300">
                {f.icon} {f.label}
              </div>
            ))}
          </div>
          <button
            onClick={() => onOpenAuth('retailer')}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-10 py-5 text-lg font-black text-slate-950 shadow-[0_0_60px_rgba(52,211,153,0.4)] transition hover:bg-emerald-400 hover:-translate-y-1"
          >
            Join the Network <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};