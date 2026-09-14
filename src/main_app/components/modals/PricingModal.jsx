import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Sparkle, Lightning, Crown, MagicWand, Star } from '@phosphor-icons/react';

const tiers = [
  {
    name: 'Freemium',
    tagline: 'Get started',
    description: 'Essential tools to begin your journey.',
    monthlyPrice: '0',
    semesterPrice: '0',
    icon: Star,
    iconColor: 'text-slate-400',
    accentColor: 'slate',
    features: [
      'Core PDF Reader & Dictionary',
      'Basic Gamification & XP',
      'Limited AI Chat (10/day)',
      'Standard Cloud Sync',
      'Ad-supported Experience',
    ],
    buttonText: 'Current Plan',
    popular: false,
  },
  {
    name: 'Mini',
    tagline: 'Level up',
    description: 'Perfect for casual learners.',
    monthlyPrice: '1,000',
    semesterPrice: '2,500',
    icon: MagicWand,
    iconColor: 'text-blue-400',
    accentColor: 'blue',
    features: [
      'Advanced Reader (Simplify & Ask AI)',
      'Unlimited Notebooks & Notes',
      'Full Analytics & Study Wrap',
      'Increased AI (30 Chats, 50 Cards)',
      'Ad-free Experience',
    ],
    buttonText: 'Upgrade to Mini',
    popular: false,
  },
  {
    name: 'Plus',
    tagline: 'Most popular',
    description: 'The standard for serious students.',
    monthlyPrice: '2,000',
    semesterPrice: '5,000',
    icon: Lightning,
    iconColor: 'text-brand-light',
    accentColor: 'brand',
    features: [
      'Generous AI (100 Chats, 100 Cards)',
      'Unlimited Flashcard & Quiz Practice',
      'Complete Exam Reminders',
      'Advanced Cloud Sync',
      'Everything in Mini',
    ],
    buttonText: 'Upgrade to Plus',
    popular: true,
  },
  {
    name: 'Premium',
    tagline: 'Ultimate',
    description: 'Unlimited power for total mastery.',
    monthlyPrice: '3,500',
    semesterPrice: '9,000',
    icon: Crown,
    iconColor: 'text-amber-400',
    accentColor: 'amber',
    features: [
      'Unlimited AI Chat & Book Summaries',
      'Max AI Gen (200 Cards, 100 Quizzes)',
      'Export Notes & Cards (PDF/Word)',
      'Priority Customer Support',
      'Everything in Plus',
    ],
    buttonText: 'Go Premium',
    popular: false,
  },
];

export default function PricingModal({ isOpen, onClose }) {
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] animate-in fade-in duration-300"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />

      {/* Scrollable Content Layer */}
      <div
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        onClick={handleBackdropClick}
      >
        <div className="flex min-h-full justify-center px-4 py-10 sm:py-16 md:py-20">

          {/* Modal Panel */}
          <div
            className="relative w-full max-w-[1200px] animate-in slide-in-from-bottom-4 fade-in duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 md:top-4 md:right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white border border-white/10 transition-all duration-200 backdrop-blur-md shadow-lg"
              aria-label="Close pricing"
            >
              <X size={20} weight="bold" />
            </button>

            {/* ── HEADER ── */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/15 border border-brand/25 mb-8">
                <Sparkle size={16} weight="fill" className="text-brand-light" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-lighter">Choose your plan</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-5 tracking-tight leading-tight">
                Supercharge your{' '}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-brand-lighter">
                    learning
                  </span>
                </span>
              </h2>

              <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Affordable, student-friendly plans with world-class study tools.
              </p>

              {/* Billing Toggle */}
              <div className="mt-10 inline-flex items-center p-1 rounded-full bg-white/[0.06] border border-white/10 shadow-inner">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-black shadow-md'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('semester')}
                  className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    billingCycle === 'semester'
                      ? 'bg-white text-black shadow-md'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <span>Semester</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    billingCycle === 'semester'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    Save
                  </span>
                </button>
              </div>
            </div>

            {/* ── PRICING GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {tiers.map((tier, idx) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.name}
                    className={`
                      relative flex flex-col rounded-3xl border transition-all duration-500 group
                      ${tier.popular
                        ? 'bg-gradient-to-b from-brand/20 via-brand/[0.07] to-transparent border-brand/50 shadow-[0_0_40px_rgba(124,58,237,0.15)] lg:scale-[1.04] z-10'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]'
                      }
                    `}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Popular badge */}
                    {tier.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-brand to-brand-light text-white text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-lg shadow-brand/40 whitespace-nowrap">
                          ★ Most Popular
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col flex-grow p-6 sm:p-7">
                      {/* Icon + Name */}
                      <div className="mb-6">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                          tier.popular
                            ? 'bg-gradient-to-br from-brand to-brand-deep'
                            : 'bg-white/[0.06] border border-white/10'
                        }`}>
                          <Icon
                            size={22}
                            weight="fill"
                            className={tier.popular ? 'text-white' : tier.iconColor}
                          />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/30 mb-1">{tier.tagline}</p>
                        <h3 className="text-xl font-bold font-display text-white">{tier.name}</h3>
                      </div>

                      {/* Price */}
                      <div className="mb-6 pb-6 border-b border-white/[0.07]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-semibold text-white/40">₦</span>
                          <span className="text-4xl font-display font-black text-white tracking-tight">
                            {billingCycle === 'monthly' ? tier.monthlyPrice : tier.semesterPrice}
                          </span>
                        </div>
                        <p className="text-xs text-white/30 mt-1.5 font-medium">
                          per {billingCycle === 'monthly' ? 'month' : 'semester'}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3.5 flex-grow mb-8">
                        {tier.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle
                              size={16}
                              weight="fill"
                              className={`mt-0.5 flex-shrink-0 ${
                                tier.popular ? 'text-brand-light' : 'text-white/25'
                              }`}
                            />
                            <span className={`text-[13px] leading-snug ${
                              tier.popular && i === tier.features.length - 1
                                ? 'font-semibold text-white/90'
                                : 'text-white/50'
                            }`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="mt-auto">
                        <button
                          disabled={tier.name === 'Freemium'}
                          className={`
                            w-full py-3 px-6 rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.97]
                            disabled:opacity-30 disabled:cursor-not-allowed
                            ${tier.popular
                              ? 'bg-gradient-to-r from-brand via-brand-light to-brand text-white shadow-lg shadow-brand/30 hover:shadow-brand/50 hover:brightness-110'
                              : 'bg-white/[0.08] text-white/70 border border-white/10 hover:bg-white/[0.14] hover:text-white'
                            }
                          `}
                        >
                          {tier.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-white/25 mt-10">
              All prices in Nigerian Naira (₦). Cancel or switch plans anytime.
            </p>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
