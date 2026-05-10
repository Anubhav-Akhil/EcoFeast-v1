import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Leaf, Target, Globe2, Users, ShieldCheck, HandHeart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const timelineItems = [
  {
    year: '2023',
    label: 'The Problem',
    icon: <Target size={20} />,
    title: 'One-third of all food produced globally is wasted.',
    body: 'While millions go hungry, supermarkets and restaurants discard perfectly edible food daily due to broken coordination — not scarcity.',
    color: 'from-rose-500 to-orange-500',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900/40',
  },
  {
    year: 'Insight',
    label: 'The Gap',
    icon: <Globe2 size={20} />,
    title: 'Technology was missing from the rescue chain.',
    body: 'Charities relied on phone calls. Retailers had no channel. Volunteers had no tasks. EcoFeast was born to close these coordination gaps.',
    color: 'from-amber-500 to-yellow-500',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  {
    year: 'Today',
    label: 'The Platform',
    icon: <Leaf size={20} />,
    title: 'A live marketplace for food rescue.',
    body: 'Retailers list surplus in real time. Consumers and charities claim it. Volunteers close the last mile. Every rescue is tracked and measured.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
  },
  {
    year: '→',
    label: 'The Vision',
    icon: <Globe2 size={20} />,
    title: 'A world where food is too valuable to waste.',
    body: 'We are building the infrastructure layer that makes every community a zero-waste food zone — powered by data, logistics, and local trust.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-900/40',
  },
];

const principles = [
  { icon: <Leaf size={22} />, title: 'Sustainability with execution', body: 'Outcomes must be both environmentally meaningful and operationally realistic.' },
  { icon: <ShieldCheck size={22} />, title: 'Trust through transparency', body: 'Clear listings, visible status, and measurable impact build confidence for every participant.' },
  { icon: <HandHeart size={22} />, title: 'Community-centered design', body: 'Built around the people buying, donating, coordinating, and delivering food rescue.' },
  { icon: <Users size={22} />, title: 'Radical inclusivity', body: 'Every role — retailer, consumer, charity, volunteer — deserves first-class experience.' },
];

function TimelineCard({ item, index }: { item: (typeof timelineItems)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`relative rounded-[32px] border p-8 ${item.bg} ${item.border}`}
    >
      <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${item.color} px-4 py-2 text-sm font-bold text-white mb-5`}>
        {item.icon} {item.label}
      </div>
      <div className="text-[3rem] font-black text-slate-200 dark:text-white/5 select-none absolute right-6 top-4 leading-none">{item.year}</div>
      <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-4 leading-tight max-w-xs">{item.title}</h3>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
    </motion.div>
  );
}

function PrincipleCard({ p, i }: { p: (typeof principles)[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-emerald-900/30 dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white transition-all">
        {p.icon}
      </div>
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">{p.title}</h3>
      <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{p.body}</p>
    </motion.div>
  );
}

export const About: React.FC = () => {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLDivElement>(null);
  const counterInView = useInView(counterRef, { once: true });

  useEffect(() => {
    if (!counterInView) return;
    const end = 33;
    const step = end / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 25);
    return () => clearInterval(timer);
  }, [counterInView]);

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020917] text-slate-900 dark:text-white">

      {/* ── HERO: FULL-BLEED TYPOGRAPHIC ─────────────────── */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden pb-20 pt-20 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(160deg, #020917 60%, #042b1e 100%)' }}
      >
        {/* Subtle dot grid instead of clashing watermark */}
        <div className="dot-grid absolute inset-0 opacity-20" />
        {/* Orbs */}
        <div className="ambient-orb left-[5%] top-20 h-80 w-80 bg-emerald-500/20" />
        <div className="ambient-orb animation-delay-2000 right-[10%] bottom-0 h-64 w-64 bg-teal-400/15" />

        <div className="relative z-10 mx-auto max-w-7xl w-full">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400 mb-6">Our Story</p>
            <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-none tracking-tight text-white max-w-4xl">
              We built EcoFeast because<br />
              <span className="gradient-text-dark">great food shouldn't</span><br />
              become landfill.
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-slate-300 leading-relaxed">
              One in three meals produced globally is wasted. EcoFeast is our answer — 
              a platform that makes food rescue practical, profitable, and community-powered.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SHOCKING STAT ─────────────────────────────────── */}
      <section ref={counterRef} className="py-20 px-4 text-center bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-3xl">
          <div className="text-[clamp(5rem,18vw,14rem)] font-black leading-none">
            <span className="gradient-text-eco">{count}</span>
            <span className="gradient-text-eco">%</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 -mt-4">
            of all food produced globally is wasted.
          </p>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg">
            That's 1.3 billion tonnes per year. EcoFeast is changing that, one rescue at a time.
          </p>
        </div>
      </section>

      {/* ── TIMELINE GRID ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/60 dark:bg-[#06111b]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">The Journey</p>
            <h2 className="text-4xl font-black text-slate-950 dark:text-white md:text-5xl">From problem to platform.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {timelineItems.map((item, i) => (
              <TimelineCard key={item.label} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#020917]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 mb-4">What Guides Us</p>
              <h2 className="text-4xl font-black text-slate-950 dark:text-white md:text-5xl mb-6 leading-tight">
                Mission-led.<br />
                Product-disciplined.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                We want EcoFeast to feel trustworthy for partners, approachable for communities, 
                and practical enough to support real rescue workflows day after day.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {principles.map((p, i) => <PrincipleCard key={p.title} p={p} i={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER CARD ─────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/60 dark:bg-[#06111b]">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[40px] p-10 text-white"
            style={{ background: 'linear-gradient(135deg, #020917 0%, #064e3b 60%, #059669 100%)' }}
          >
            <div className="dot-grid absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-400 mb-4">Founder</p>
              <h2 className="text-4xl font-black mb-4">Anubhav Akhil</h2>
              <p className="text-lg text-emerald-100/90 leading-relaxed max-w-xl mb-8">
                EcoFeast is driven by the belief that technology makes sustainability more actionable 
                when it solves real coordination problems for real communities.
              </p>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold text-white backdrop-blur border border-white/15">
                <Leaf size={16} className="text-emerald-400" />
                Food recovery · Local impact · Better systems
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center bg-white dark:bg-[#020917]">
        <h2 className="text-4xl font-black text-slate-950 dark:text-white mb-6">Ready to help rescue food?</h2>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/marketplace" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-[0_0_40px_rgba(52,211,153,0.3)] transition hover:bg-emerald-500 hover:-translate-y-1">
            Explore Marketplace <ArrowRight size={16} />
          </Link>
          <Link to="/partners" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 hover:-translate-y-1">
            Partner With Us
          </Link>
        </div>
      </section>
    </div>
  );
};
