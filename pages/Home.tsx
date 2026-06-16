import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, Zap, Heart, ShoppingBag, Building2, Users, Truck, Star, ChevronDown, LogIn, UserPlus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface HomeProps {
  user?: User | null;
  onOpenAuth?: (role?: UserRole, mode?: 'login' | 'signup') => void;
}

// Floating accent icons (Lucide names rendered in the component)
const floatingItems = [
  { icon: 'leaf', x: 8, y: 18, dur: 7, delay: 0 },
  { icon: 'shopping-bag', x: 88, y: 12, dur: 9, delay: 1.2 },
  { icon: 'heart', x: 75, y: 55, dur: 8, delay: 0.5 },
  { icon: 'zap', x: 15, y: 65, dur: 10, delay: 2 },
  { icon: 'star', x: 55, y: 8, dur: 6, delay: 1.5 },
  { icon: 'truck', x: 92, y: 78, dur: 11, delay: 0.8 },
  { icon: 'leaf', x: 4, y: 88, dur: 8, delay: 3 },
  { icon: 'heart', x: 48, y: 90, dur: 7, delay: 2.5 },
];

const tickerItems = [
  '2.5M+ meals rescued', '·', '1.2M kg CO₂ avoided', '·', '4,200 partner stores',
  '·', '70% average savings', '·', '500+ charities served', '·', '92% pickup completion',
  '·', '2.5M+ meals rescued', '·', '1.2M kg CO₂ avoided', '·', '4,200 partner stores',
  '·', '70% average savings', '·', '500+ charities served', '·', '92% pickup completion', '·',
];

const roles = [
  { label: 'For Consumers', icon: <ShoppingBag size={20} />, color: 'from-emerald-500 to-teal-500', link: '/marketplace', cta: 'Shop Now', desc: 'Save up to 70% on quality surplus food from local stores.' },
  { label: 'For Retailers', icon: <Building2 size={20} />, color: 'from-violet-500 to-purple-600', link: '/partners', cta: 'Partner Up', desc: 'Turn unsold inventory into revenue, not landfill.' },
  { label: 'For Charities', icon: <Heart size={20} />, color: 'from-rose-500 to-pink-600', link: '/charities', cta: 'Connect', desc: 'Access donation-ready food faster and feed more people.' },
  { label: 'For Volunteers', icon: <Users size={20} />, color: 'from-amber-500 to-orange-500', link: '/volunteers', cta: 'Help Out', desc: 'Close the last-mile gap and make your community stronger.' },
];

const workflowSteps = [
  { n: '01', title: 'Stores list surplus', icon: <Building2 size={24} />, desc: 'Live inventory posted with pricing, quantities, and pickup windows.' },
  { n: '02', title: 'Demand discovers', icon: <ShoppingBag size={24} />, desc: 'Consumers & charities find offers near them before they expire.' },
  { n: '03', title: 'Volunteers coordinate', icon: <Truck size={24} />, desc: 'Last-mile pickup assigned and tracked in real time.' },
  { n: '04', title: 'Impact compounds', icon: <Leaf size={24} />, desc: 'Every rescue creates measurable community and climate value.' },
];

export const Home: React.FC<HomeProps> = ({ user, onOpenAuth }) => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yOrb = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const springY = useSpring(yTitle, { stiffness: 80, damping: 20 });

  const [activeRole, setActiveRole] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [roleSwitchPrompt, setRoleSwitchPrompt] = useState<{ roleName: string; roleKey: UserRole; color: string } | null>(null);

  // Map role index to UserRole key
  const roleKeyMap: Record<number, UserRole> = { 0: 'consumer', 1: 'retailer', 2: 'charity', 3: 'volunteer' };

  const handleRoleCta = (roleIdx: number) => {
    const role = roles[roleIdx];
    const targetRole = roleKeyMap[roleIdx];

    // Not logged in — navigate normally
    if (!user) {
      navigate(role.link);
      return;
    }

    // Same role as current user — navigate normally
    if (user.role === targetRole) {
      navigate(role.link);
      return;
    }

    // Different role — show prompt then open auth
    setRoleSwitchPrompt({
      roleName: role.label.replace('For ', ''),
      roleKey: targetRole,
      color: role.color,
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setActiveRole(p => (p + 1) % roles.length), 3200);
    return () => clearInterval(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        onMouseMove={handleMouseMove}
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% -10%, rgba(16,185,129,0.22) 0%, transparent 60%)' }}
      >
        {/* Interactive glow that follows mouse */}
        <div
          className="pointer-events-none absolute z-0 h-96 w-96 rounded-full opacity-30 transition-all duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(52,211,153,0.4), transparent 70%)',
            left: mousePos.x - 192,
            top: mousePos.y - 192,
            filter: 'blur(40px)',
          }}
        />

        {/* Dot grid */}
        <div className="dot-grid absolute inset-0 opacity-40 dark:opacity-30" />

        {/* Floating accent icons */}
        {floatingItems.map((item, i) => {
          const IconMap: Record<string, any> = { 'leaf': Leaf, 'shopping-bag': ShoppingBag, 'heart': Heart, 'zap': Zap, 'star': Star, 'truck': Truck };
          const Icon = IconMap[item.icon] || Leaf;
          return (
            <div
              key={i}
              className="float-icon pointer-events-none absolute select-none opacity-[0.12] dark:opacity-[0.08] text-emerald-600 dark:text-emerald-400"
              style={{ left: `${item.x}%`, top: `${item.y}%`, '--dur': `${item.dur}s`, '--delay': `${item.delay}s` } as React.CSSProperties}
            >
              <Icon size={22} />
            </div>
          );
        })}

        {/* Morphing blob behind title */}
        <motion.div
          style={{ y: yOrb }}
          className="animate-morph pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-emerald-400/10 dark:bg-emerald-500/8"
        />

        {/* Hero content */}
        <motion.div style={{ y: springY, opacity }} className="relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 px-4 py-2 text-sm font-bold text-emerald-800 backdrop-blur dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-300 mb-8"
          >
            <Zap size={14} className="fill-current" />
            Live surplus rescue platform
            <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mx-auto max-w-5xl text-[clamp(2.8rem,8vw,7rem)] font-black leading-none tracking-tighter"
          >
            <span className="block">Food waste</span>
            <span className="gradient-text-eco block">ends here.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl"
          >
            EcoFeast connects surplus food from retailers to consumers, charities, and volunteers —
            turning what would be waste into measurable community value.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/marketplace"
              className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-[0_0_40px_rgba(52,211,153,0.35)] transition-all hover:bg-emerald-500 hover:shadow-[0_0_60px_rgba(52,211,153,0.5)] hover:-translate-y-1"
            >
              Explore Marketplace
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 font-bold text-slate-700 backdrop-blur transition-all hover:-translate-y-1 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:text-emerald-300"
            >
              Our Story
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 dark:text-slate-600"
        >
          <ChevronDown size={28} />
        </motion.div>
      </section>

      {/* ── TICKER TAPE ──────────────────────────────────── */}
      <div className="border-y border-emerald-200/60 bg-emerald-50/60 py-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 overflow-hidden">
        <div className="ticker-track gap-10 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {tickerItems.map((item, i) => (
            <span key={i} className="mx-6 whitespace-nowrap">{item}</span>
          ))}
        </div>
      </div>

      {/* ── ROLE SWITCHER ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: role description */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">Built For Everyone</p>
              <h2 className="text-4xl font-black leading-tight text-slate-950 dark:text-white md:text-5xl mb-8">
                One platform,<br />every role in the chain.
              </h2>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.35 }}
                  className="mb-8"
                >
                  <div className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${roles[activeRole].color} px-4 py-2 text-sm font-bold text-white mb-4`}>
                    {roles[activeRole].icon}
                    {roles[activeRole].label}
                  </div>
                  <p className="text-2xl font-light text-slate-600 dark:text-slate-300 leading-relaxed">
                    {roles[activeRole].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
              <button
                onClick={() => handleRoleCta(activeRole)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
              >
                {roles[activeRole].cta} <ArrowRight size={16} />
              </button>
            </div>

            {/* Right: role selector pills */}
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role, i) => (
                <motion.button
                  key={role.label}
                  onClick={() => setActiveRole(i)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`perspective-card rounded-3xl p-6 text-left transition-all duration-300 ${activeRole === i
                      ? 'bg-gradient-to-br ' + role.color + ' text-white shadow-2xl'
                      : 'border border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-emerald-200 dark:border-dark-800 dark:bg-dark-900/70 dark:text-slate-200'
                    }`}
                >
                  <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${activeRole === i ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {role.icon}
                  </div>
                  <div className="text-lg font-bold">{role.label}</div>
                  {activeRole === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1">
                      <Star size={14} className="fill-current opacity-70" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Role-switch prompt banner */}
          <AnimatePresence>
            {roleSwitchPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="mt-10"
              >
                <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r ${roleSwitchPrompt.color} p-6 sm:p-8 text-white shadow-2xl`}>
                  {/* Background shimmer */}
                  <div className="absolute inset-0 dot-grid opacity-15" />
                  <motion.div
                    className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  <button
                    onClick={() => setRoleSwitchPrompt(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X size={16} />
                  </button>

                  <div className="relative z-10">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70 mb-2">Switch Role</p>
                      <h3 className="text-2xl sm:text-3xl font-black mb-3">
                        Want to join as a {roleSwitchPrompt.roleName.replace(/s$/, '')}?
                      </h3>
                      <p className="text-white/80 text-sm sm:text-base mb-6 max-w-xl">
                        You're currently logged in as a <span className="font-black capitalize">{user?.role}</span>. Create a new {roleSwitchPrompt.roleName.replace(/s$/, '').toLowerCase()} account or log in to an existing one.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      <button
                        onClick={() => {
                          setRoleSwitchPrompt(null);
                          if (onOpenAuth) onOpenAuth(roleSwitchPrompt.roleKey, 'signup');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-900 transition-all hover:bg-white/90 hover:-translate-y-0.5 shadow-lg"
                      >
                        <UserPlus size={18} /> Create {roleSwitchPrompt.roleName.replace(/s$/, '')} Account
                      </button>
                      <button
                        onClick={() => {
                          setRoleSwitchPrompt(null);
                          if (onOpenAuth) onOpenAuth(roleSwitchPrompt.roleKey, 'login');
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/30 px-6 py-3.5 font-bold text-white transition-all hover:bg-white/10 hover:-translate-y-0.5"
                      >
                        <LogIn size={18} /> Log In as {roleSwitchPrompt.roleName.replace(/s$/, '')}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── HOW IT WORKS – DIAGONAL STEPS ─────────────────── */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-28 px-4 text-slate-900 dark:text-white sm:px-6 lg:px-8">
        {/* Diagonal stripe */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -left-20 top-0 h-full w-1/2 rotate-[-6deg] bg-emerald-400" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-16 flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400 mb-3">The Flow</p>
              <h2 className="text-4xl font-black md:text-5xl">How the rescue<br />chain works.</h2>
            </div>
            <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10">
              See it live <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-px bg-white/10 rounded-3xl overflow-hidden md:grid-cols-4">
            {workflowSteps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-white dark:bg-slate-950 p-8 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <div className="text-[4rem] font-black text-slate-200 dark:text-white/5 select-none absolute right-4 top-2">{step.n}</div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  {step.icon}
                </div>
                <h3 className="text-xl font-black mb-3">{step.title}</h3>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE STATS STRIP ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '2.5M+', label: 'Meals rescued', suffix: '' },
              { value: '1.2M', label: 'kg CO₂ avoided', suffix: 'kg' },
              { value: '4,200', label: 'Partner stores', suffix: '' },
              { value: '70%', label: 'Average savings', suffix: '' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-emerald-900/30 dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all hover:-translate-y-1"
              >
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 md:text-5xl">{stat.value}</div>
                <div className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[40px] bg-emerald-600 p-12 text-white text-center"
            style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)' }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 dot-grid opacity-20" />
            <div className="relative z-10">
              <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-200 mb-4">Ready To Start</p>
              <h2 className="text-4xl font-black md:text-5xl mb-6">
                Every meal rescued<br />is a planet saved.
              </h2>
              <p className="text-lg text-emerald-100/90 max-w-2xl mx-auto mb-10">
                Join thousands of people already turning food surplus into community impact through EcoFeast.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-emerald-900 transition hover:bg-emerald-50 hover:-translate-y-1"
                >
                  Explore Marketplace <ArrowRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white/10 hover:-translate-y-1"
                >
                  Talk To Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
