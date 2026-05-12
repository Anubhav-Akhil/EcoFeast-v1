import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Store, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  MapPin, 
  ClipboardCheck, 
  Package, 
  CheckCircle2,
  Users,
  Smartphone,
  Sparkles,
  Building2,
  Globe2,
  Clock
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

type Role = 'partner' | 'charity' | 'volunteer';

interface HowItWorksProps {
  onOpenAuth: (role: Role | 'retailer') => void;
}

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleData: Record<Role, {
  title: string;
  badge: string;
  headline: string;
  description: string;
  badgeClass: string;
  iconBgClass: string;
  iconTextClass: string;
  borderHoverClass: string;
  accent: string;
  gradient: string;
  steps: Step[];
  cta: string;
  features: { icon: React.ReactNode; title: string; desc: string }[];
}> = {
  partner: {
    title: 'Partner',
    badge: 'For Retailers & Restaurants',
    headline: 'Turn Surplus Into Revenue',
    description: 'Transform your excess inventory from a sunk cost into a new revenue stream while building genuine sustainability credentials for your brand.',
    badgeClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    iconBgClass: 'bg-emerald-500/10',
    iconTextClass: 'text-emerald-400',
    borderHoverClass: 'group-hover:border-emerald-500/50',
    accent: 'bg-emerald-500',
    gradient: 'from-emerald-500/10 to-transparent',
    cta: 'Register Your Store',
    steps: [
      {
        id: '01',
        title: 'List Surplus Items',
        description: 'Upload food that is nearing expiry or overstocked. Set your own prices, quantities, and preferred pickup windows in seconds.',
        icon: <Store size={24} />
      },
      {
        id: '02',
        title: 'Instant Network Visibility',
        description: 'Your items instantly appear on the marketplace, notifying thousands of local consumers and verified charities in your area.',
        icon: <Zap size={24} />
      },
      {
        id: '03',
        title: 'Seamless Fulfillment',
        description: 'Track orders in real-time. Volunteers or customers pick up the items during your specified window with zero disruption to your staff.',
        icon: <Package size={24} />
      },
      {
        id: '04',
        title: 'Track ESG Impact',
        description: 'Get automated reports detailing your recovered revenue, CO₂ emissions prevented, and community impact for your sustainability goals.',
        icon: <TrendingUp size={24} />
      }
    ],
    features: [
      { icon: <ShieldCheck size={18} />, title: 'Secure Payments', desc: 'Guaranteed payouts for all orders.' },
      { icon: <TrendingUp size={18} />, title: 'Analytics', desc: 'Real-time waste reduction insights.' },
      { icon: <Building2 size={18} />, title: 'Multi-store', desc: 'Manage all locations centrally.' }
    ]
  },
  charity: {
    title: 'Charity',
    badge: 'For NGOs & Shelters',
    headline: 'Consistent Food Supply',
    description: 'Gain access to a reliable stream of high-quality surplus food from local businesses. We handle the logistics so you can focus on serving the community.',
    badgeClass: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    iconBgClass: 'bg-rose-500/10',
    iconTextClass: 'text-rose-400',
    borderHoverClass: 'group-hover:border-rose-500/50',
    accent: 'bg-rose-500',
    gradient: 'from-rose-500/10 to-transparent',
    cta: 'Register Your Charity',
    steps: [
      {
        id: '01',
        title: 'Verified Access',
        description: 'Complete our simple verification process to gain priority access to free or highly discounted bulk surplus food listings.',
        icon: <ShieldCheck size={24} />
      },
      {
        id: '02',
        title: 'Browse & Claim',
        description: 'View real-time donations from nearby retailers. Claim exactly what you need for your programs with a single tap.',
        icon: <Heart size={24} />
      },
      {
        id: '03',
        title: 'Automated Delivery',
        description: 'Once claimed, our network of local volunteers is immediately dispatched to pick up and deliver the food directly to your facility.',
        icon: <Truck size={24} />
      },
      {
        id: '04',
        title: 'Simple Verification',
        description: 'Receive the food and verify the delivery with a secure OTP, automatically updating impact metrics for both you and the donor.',
        icon: <Smartphone size={24} />
      }
    ],
    features: [
      { icon: <Heart size={18} />, title: 'Free Logistics', desc: 'Zero delivery costs for NGOs.' },
      { icon: <Globe2 size={18} />, title: 'Safe Supply', desc: 'Strict food safety standards.' },
      { icon: <Users size={18} />, title: 'Network', desc: 'Direct access to local donors.' }
    ]
  },
  volunteer: {
    title: 'Volunteer',
    badge: 'For Individuals',
    headline: 'Be The Impact Driver',
    description: 'Become the crucial link between surplus food and those who need it. Complete hyper-local delivery tasks on your own schedule and earn rewards.',
    badgeClass: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    iconBgClass: 'bg-amber-500/10',
    iconTextClass: 'text-amber-400',
    borderHoverClass: 'group-hover:border-amber-500/50',
    accent: 'bg-amber-500',
    gradient: 'from-amber-500/10 to-transparent',
    cta: 'Become a Volunteer',
    steps: [
      {
        id: '01',
        title: 'Find Active Tasks',
        description: 'Open the app to see live food rescue tasks nearby. Choose deliveries that fit perfectly with your current route or daily schedule.',
        icon: <MapPin size={24} />
      },
      {
        id: '02',
        title: 'Guided Pickup',
        description: 'Navigate to the store where staff will have the surplus items packaged, sealed, and ready for your immediate pickup.',
        icon: <ClipboardCheck size={24} />
      },
      {
        id: '03',
        title: 'Direct Delivery',
        description: 'Follow optimized routing to deliver the food to a local charity. Most deliveries take less than 15 minutes to complete.',
        icon: <Truck size={24} />
      },
      {
        id: '04',
        title: 'Earn & Track Impact',
        description: 'Verify the drop-off and instantly earn Eco-Points. Watch your personal impact dashboard grow as you prevent CO₂ emissions.',
        icon: <Sparkles size={24} />
      }
    ],
    features: [
      { icon: <Clock size={18} />, title: 'Flexibility', desc: 'Volunteer on your own terms.' },
      { icon: <Sparkles size={18} />, title: 'Rewards', desc: 'Earn points and unlock perks.' },
      { icon: <MapPin size={18} />, title: 'Hyper-Local', desc: 'Help your immediate community.' }
    ]
  }
};

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as Role) || 'partner';
  const [activeRole, setActiveRole] = useState<Role>(initialRole);

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    setSearchParams({ role });
  };

  const handleCTAClick = () => {
    const authRole = activeRole === 'partner' ? 'retailer' : activeRole;
    onOpenAuth(authRole);
  };

  useEffect(() => {
    const role = searchParams.get('role') as Role;
    if (role && roleData[role]) {
      setActiveRole(role);
    }
  }, [searchParams]);

  const current = roleData[activeRole];

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-emerald-500/30 font-sans">
      {/* ── AMBIENT BACKGROUND ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${current.gradient}`}
          />
        </AnimatePresence>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-400 mb-8 backdrop-blur-md">
              <Sparkles size={14} className="text-emerald-400" />
              The Ecosystem
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              Connecting the dots for a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">zero-waste future.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
              We've automated the logistics of food rescue so you can focus on making a tangible difference in your community.
            </p>
          </motion.div>

          {/* Premium Role Toggles */}
          <div className="inline-flex p-1.5 bg-white/5 border border-white/10 rounded-[28px] backdrop-blur-2xl shadow-2xl">
            {(['partner', 'charity', 'volunteer'] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`relative px-8 py-4 rounded-[22px] text-sm font-black transition-all duration-500 ${
                  activeRole === role 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeRole === role && (
                  <motion.div 
                    layoutId="activeTabGlow" 
                    className={`absolute inset-0 z-0 ${roleData[role].accent} shadow-lg`}
                    style={{ borderRadius: '22px' }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 uppercase tracking-wider">{roleData[role].title}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS SECTION ────────────────────────────────── */}
      <section className="pb-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="grid lg:grid-cols-[1fr_400px] gap-20 items-start"
            >
              {/* Left Column: Flow Steps */}
              <div className="space-y-24">
                <div className="max-w-2xl">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest mb-6 ${current.badgeClass}`}>
                    {current.badge}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                    {current.headline}
                  </h2>
                  <p className="text-xl text-slate-400 leading-relaxed font-medium">
                    {current.description}
                  </p>
                </div>

                <div className="grid gap-8 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-10 top-0 bottom-0 w-px bg-white/5 hidden md:block" />

                  {current.steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative flex flex-col md:flex-row gap-8 p-10 rounded-[40px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl hover:bg-white/[0.04] transition-all duration-500"
                    >
                      {/* Step Indicator */}
                      <div className={`flex-shrink-0 flex h-20 w-20 items-center justify-center rounded-3xl ${current.iconBgClass} ${current.iconTextClass} border border-white/5 shadow-xl transition-transform group-hover:scale-110 duration-500 relative z-10`}>
                        {step.icon}
                      </div>

                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2 block">Step {step.id}</span>
                        <h3 className="text-2xl font-black text-white mb-4 transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-slate-400 leading-relaxed text-lg font-medium max-w-lg">
                          {step.description}
                        </p>
                      </div>

                      <div className="absolute right-10 bottom-4 text-[6rem] font-black text-white/[0.02] select-none pointer-events-none">
                        {step.id}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: CTA Sidebar */}
              <div className="sticky top-32 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 rounded-[48px] bg-white/[0.03] border border-white/10 relative overflow-hidden shadow-2xl group"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${current.accent}`} />
                  
                  <h3 className="text-3xl font-black mb-6 leading-tight">
                    Start making an impact <span className="text-emerald-400">today.</span>
                  </h3>
                  
                  <p className="text-slate-400 mb-10 leading-relaxed text-lg font-medium">
                    Join our mission to eliminate food waste. Whether you're a retailer, a charity, or a volunteer — there's a seat at the table.
                  </p>
                  
                  <button 
                    onClick={handleCTAClick}
                    className={`w-full py-6 rounded-2xl font-black text-slate-950 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl ${current.accent} hover:brightness-110`}
                  >
                    <span className="text-lg">{current.cta}</span>
                    <ArrowRight size={22} />
                  </button>
                </motion.div>

                {/* Features List */}
                <div className="p-8 rounded-[40px] bg-white/[0.01] border border-white/5 space-y-8">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Key Benefits</h4>
                   {current.features.map((f, i) => (
                     <div key={i} className="flex gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${current.iconBgClass} ${current.iconTextClass} flex items-center justify-center`}>
                           {f.icon}
                        </div>
                        <div>
                           <h5 className="font-black text-sm text-white mb-1">{f.title}</h5>
                           <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────── */}
      <section className="py-32 border-t border-white/5 bg-black/20 relative z-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <ShieldCheck className="text-emerald-500" />, title: 'Enterprise Security', text: 'All transactions and data are encrypted and verified.' },
              { icon: <Smartphone className="text-blue-500" />, title: 'Real-Time Sync', text: 'Optimized for neighborhood logistics and zero latency.' },
              { icon: <CheckCircle2 className="text-purple-500" />, title: 'Impact Metrics', text: 'See your contribution metrics update instantly.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-center">
                <div className="flex-shrink-0 h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 flex">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
