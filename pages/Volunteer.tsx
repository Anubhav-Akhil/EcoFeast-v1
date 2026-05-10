import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Heart, Leaf, ShieldCheck, Zap, ArrowRight, MapPin, BadgeCheck, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { UserRole } from '../types';

interface VolunteerProps {
  onOpenAuth: (role: UserRole) => void;
}

const benefits = [
  {
    icon: <Sparkles size={28} />,
    title: 'Earn Eco-Points',
    body: 'Every delivery earns you points that can be redeemed for local rewards or donated to causes you care about.',
    stat: '150+',
    statLabel: 'points per delivery',
    color: 'from-amber-600 to-orange-600',
  },
  {
    icon: <TrendingUp size={28} />,
    title: 'Track Your Impact',
    body: 'See exactly how much food you\'ve saved and the CO2 emissions you\'ve prevented from entering the atmosphere.',
    stat: '2.5kg',
    statLabel: 'avg. CO2 saved per trip',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    icon: <Heart size={28} />,
    title: 'Help Your Community',
    body: 'Be the bridge between surplus food and the people who need it most. Make a direct, local impact today.',
    stat: '100%',
    statLabel: 'local community focus',
    color: 'from-rose-600 to-pink-600',
  },
];

const features = [
  { icon: <Clock size={20} />, label: 'Flexible timing' },
  { icon: <MapPin size={20} />, label: 'Hyper-local tasks' },
  { icon: <ShieldCheck size={20} />, label: 'Contactless pickup' },
  { icon: <BadgeCheck size={20} />, label: 'Impact certificates' },
  { icon: <Zap size={20} />, label: 'Instant point rewards' },
  { icon: <Truck size={20} />, label: 'Live route tracking' },
];

const steps = [
  { n: '01', title: 'Sign up as a Volunteer', body: 'Create your account and complete a simple background verification in minutes.' },
  { n: '02', title: 'Browse Active Tasks', body: 'See real-time food rescue pickups ready near your current location or along your commute.' },
  { n: '03', title: 'Pick up and Deliver', body: 'Follow the app-guided route to pick up surplus food from a store and drop it off at a charity.' },
  { n: '04', title: 'Get Rewarded', body: 'Complete the delivery with an OTP and instantly see your points and impact stats update.' },
];

export const Volunteer: React.FC<VolunteerProps> = ({ onOpenAuth }) => {
  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(150deg, #020917 0%, #1a1a2e 50%, #020917 100%)' }}
      >
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(245,158,11,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="ambient-orb left-[15%] top-20 h-96 w-96 bg-amber-500/25" />
        <div className="ambient-orb animation-delay-4000 right-[5%] bottom-10 h-80 w-80 bg-orange-400/15" />

        <div className="relative z-10 mx-auto max-w-7xl w-full text-center lg:text-left">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 mb-8">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Join 1,200+ local food rescuers
              </div>
              <h1 className="text-[clamp(3rem,6vw,6rem)] font-black leading-none tracking-tight text-white mb-8">
                Be the bridge<br />
                <span className="text-amber-500">to zero waste.</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-xl mb-10 mx-auto lg:mx-0">
                Rescue quality surplus food from local stores and deliver it to charities in your neighborhood. 
                Earn rewards while making a real difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => onOpenAuth('volunteer')}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-8 py-4 font-bold text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.35)] transition-all hover:bg-amber-400 hover:shadow-[0_0_60px_rgba(245,158,11,0.55)] hover:-translate-y-1"
                >
                  Start Volunteering
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-4 font-bold text-white transition hover:bg-white/5 hover:-translate-y-1">
                  How it Works
                </button>
              </div>
            </motion.div>

            {/* Visual element / Image / Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="rounded-3xl border border-amber-500/20 bg-amber-950/20 p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-white">Active Pickup Ready</h4>
                      <p className="text-xs text-amber-400">2.4km from you • 15 min estimated</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-4 w-4 rounded-full border-2 border-amber-500 bg-amber-500" />
                        <div className="w-0.5 h-12 bg-amber-500/30" />
                        <div className="h-4 w-4 rounded-full border-2 border-emerald-500 bg-transparent" />
                      </div>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500">Pickup Location</p>
                          <p className="text-sm font-bold text-white">Green Earth Market • Sector 42</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-500">Delivery To</p>
                          <p className="text-sm font-bold text-white">Hope Kitchen Foundation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-amber-300 font-bold">Reward</span>
                      <span className="text-xs text-amber-300 font-black">+150 Points</span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS GRID ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400 mb-4">Why Volunteer?</p>
            <h2 className="text-4xl font-black text-white md:text-5xl">Your effort, amplified.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/3 p-8 hover:border-amber-500/30 transition-all"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${b.color} text-white shadow-lg`}>
                  {b.icon}
                </div>
                <div className="text-4xl font-black text-white mb-1">{b.stat}</div>
                <div className="text-xs font-bold text-slate-500 mb-5">{b.statLabel}</div>
                <h3 className="text-xl font-black text-white mb-3">{b.title}</h3>
                <p className="text-sm leading-7 text-slate-400">{b.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0f]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400 mb-4">The Volunteer Journey</p>
            <h2 className="text-4xl font-black text-white md:text-5xl">Making an impact is<br />easier than ever.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-3xl border border-white/8 bg-white/3 p-7"
              >
                <div className="text-[3.5rem] font-black text-white/6 select-none leading-none mb-4">{step.n}</div>
                <h3 className="text-lg font-black text-white mb-3">{step.title}</h3>
                <p className="text-sm leading-7 text-slate-400">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400 mb-6">Equipped for Rescue</p>
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {features.map(f => (
              <div key={f.label} className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-3 font-bold text-amber-300">
                {f.icon} {f.label}
              </div>
            ))}
          </div>
          <button
            onClick={() => onOpenAuth('volunteer')}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-10 py-5 text-lg font-black text-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.4)] transition hover:bg-amber-400 hover:-translate-y-1"
          >
            Start Your First Rescue <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
};
