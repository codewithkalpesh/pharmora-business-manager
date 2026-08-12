// src/pages/home/LandingPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  Pill, HandCoins, BookOpen, Building2, TrendingUp, ShieldCheck,
  Star, CheckCircle2, ArrowRight, ChevronDown, Users, Award, Zap,
  BarChart3, Clock, DollarSign, Check, Phone, ChevronRight, Lock, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const reviews = [
    {
      name: 'Rajesh Sharma',
      role: 'Owner, Apollo Pharma Franchise',
      location: 'Mumbai, Maharashtra',
      rating: 5,
      avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      initials: 'RS',
      review:
        'Pharmora completely transformed how we manage daily cash flow and borrowed money. Earlier we used paper diaries for local lenders — now everything is calculated automatically with target due dates and payment reminders.',
      featureUsed: 'Borrowed Money & Repayments',
    },
    {
      name: 'Dr. Sunita Deshmukh',
      role: 'Founder, CareMed Pharmacy',
      location: 'Pune, Maharashtra',
      rating: 5,
      avatarBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      initials: 'SD',
      review:
        'The daily Cash Book and multi-bank balance sync saved us hours every evening. I can track cash-in vs UPI payments from anywhere on my phone with 100% precision.',
      featureUsed: 'Cash Book & Multi-Bank Sync',
    },
    {
      name: 'Amit Patel',
      role: 'General Manager, Dhanvantari Medico',
      location: 'Ahmedabad, Gujarat',
      rating: 5,
      avatarBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      initials: 'AP',
      review:
        'The "Borrow Again from Existing Borrower" feature is brilliant! It auto-adds the previous remaining due amount to the new loan target, eliminating manual calculation mistakes.',
      featureUsed: 'Existing Borrower Auto-Calculations',
    },
    {
      name: 'Vikas Patil',
      role: 'Partner, City Chemist & Medicals',
      location: 'Nashik, Maharashtra',
      rating: 5,
      avatarBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      initials: 'VP',
      review:
        'Best business manager software for Indian pharmacy owners. Tracking distributor bill due dates and setting financial payment goals has helped us clear vendor debts on time.',
      featureUsed: 'Distributor Payments & Goals',
    },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Daily Cash Book & Sales Sync',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      description:
        'Record daily cash-in, cash-out, UPI transactions, and reconcile opening vs closing balance with zero manual errors.',
    },
    {
      icon: HandCoins,
      title: 'Borrowed Money & Repayments',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      description:
        'Track money borrowed from lenders, manage partial repayments, auto-compute target payback, and borrow again seamlessly.',
    },
    {
      icon: Building2,
      title: 'Multi-Bank Account Sync',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      description:
        'Connect HDFC, ICICI, SBI, Axis, and custom accounts. Monitor realtime account balances and transaction histories.',
    },
    {
      icon: TrendingUp,
      title: 'Distributor & Bill Ledgers',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      description:
        'Maintain complete supplier profiles, pending purchase bills, due date alerts, and credit payment history.',
    },
    {
      icon: Award,
      title: 'Financial Payment Goals',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      description:
        'Set target deadlines to pay off major debts or distributor bills with live progress trackers and status indicators.',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics & Reports',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      description:
        'Gain insights into P&L summaries, category breakdown, cash vs digital ratios, and export clean accounting reports.',
    },
  ];

  const faqs = [
    {
      q: 'What is Pharmora Business Manager?',
      a: 'Pharmora is a dedicated cloud financial & operations management web app built specifically for pharmacy owners, medical store managers, and drug distributors to track cash flow, borrowed money, bank balances, and distributor bills.',
    },
    {
      q: 'How does the "Borrowed Money" tracking work?',
      a: 'You can record loans taken from lenders/individuals, specify payment mode (Cash/UPI/Bank), set payback target dates, and record partial repayments. If you borrow money again from an existing lender, Pharmora automatically adds their previous unpaid due to the new payback target amount.',
    },
    {
      q: 'Can I track both Cash and Bank / UPI transactions?',
      a: 'Yes! Pharmora seamlessly handles Cash, UPI, Cheque, Cards, Bank Transfers, and even Split Payments (Both Cash & UPI) with automatic synchronization to your Cash Book and Bank balances.',
    },
    {
      q: 'Is my pharmacy data safe and secure?',
      a: 'Absolutely. Pharmora uses bank-grade SSL encryption, secure JWT token authentication, and cloud-backed database storage ensuring your business data is strictly private and always accessible.',
    },
    {
      q: 'Can I use Pharmora on mobile phones and tablets?',
      a: 'Yes! Pharmora is 100% web-responsive. You can access your store dashboard on Android, iPhone, iPad, laptop, or desktop browser anytime without installing heavy desktop software.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ─── Top Navbar ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Pharmo<span className="text-emerald-400">ra</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase -mt-1">
                Business Manager
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#reviews" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <span>Reviews</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                4.9 ★
              </span>
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Ambient Glow background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-750 text-xs font-semibold text-emerald-400 mb-8 shadow-xl">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>#1 Pharmacy Financial & Borrowed Money Management System</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15] max-w-5xl mx-auto">
            Manage Cash Flow, Track <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Borrowed Money</span> & Scale Your Pharmacy.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-350 max-w-3xl mx-auto leading-relaxed">
            Built specifically for Indian medical store owners and pharmacy managers. Track daily cashbook entries, distributor debt ledgers, bank balances, and borrow money from lenders with automated payback calculations.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 rounded-2xl font-black text-base bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 group"
              >
                <span>Open Pharmacy Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-8 py-4 rounded-2xl font-black text-base bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <a
              href="#reviews"
              className="px-8 py-4 rounded-2xl font-bold text-base bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>Read Pharmacy Owner Reviews</span>
            </a>
          </div>

          {/* Trust Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">500+</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Active Medical Stores</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur">
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">₹10Cr+</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Managed Transactions</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">4.9 ★</div>
              <div className="text-xs font-medium text-slate-400 mt-1">User Review Score</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 backdrop-blur">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">99.9%</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Uptime & Accuracy</div>
            </div>
          </div>

          {/* Interactive Mockup Preview Card */}
          <div className="mt-16 relative max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">pharmora-business-manager.app / dashboard</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Live Dashboard
              </span>
            </div>

            {/* Mock KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">Total Borrowed</span>
                <span className="text-xl font-bold text-slate-100 mt-1 block">₹1,28,600</span>
                <span className="text-[10px] text-cyan-400 font-semibold mt-1 block">2 Active Lenders</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">Target Payback</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">₹1,28,600</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Auto-combined payback</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">Total Repaid</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">₹46,748</span>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">Synced to Cashbook</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider block">Remaining Due</span>
                <span className="text-xl font-bold text-red-400 mt-1 block">₹81,852</span>
                <span className="text-[10px] text-red-400 font-semibold mt-1 block">Payment Reminders Active</span>
              </div>
            </div>

            {/* Borrower row sample preview */}
            <div className="mt-6 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 text-left">
              <div className="text-xs font-extrabold uppercase text-slate-400 mb-3 tracking-wider flex items-center justify-between">
                <span>Recent Borrowed Money Records</span>
                <span className="text-cyan-400 text-[11px] font-bold">+ Borrow Again Feature Enabled</span>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 gap-3">
                  <div>
                    <span className="font-bold text-slate-100 text-sm">Vikas Patil</span>
                    <span className="text-xs text-slate-450 ml-2">+91 9158501691</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-slate-300">Borrowed: ₹73,600</span>
                    <span className="text-emerald-400">Paid: ₹33,420</span>
                    <span className="text-red-400 font-extrabold">Remaining: ₹40,180</span>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      + Borrow Again
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Features Section ─────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-2">
              Everything Your Pharmacy Needs
            </h2>
            <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Powerful Features Designed for Retail Medical Stores
            </h3>
            <p className="mt-4 text-slate-400 text-base">
              Replace messy paper logbooks and complex desktop accounting software with a modern, fast, web app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-emerald-500/5"
                >
                  <div className={`w-14 h-14 rounded-2xl ${feat.bg} border flex items-center justify-center mb-6`}>
                    <IconComp className={`w-7 h-7 ${feat.color}`} />
                  </div>
                  <h4 className="text-xl font-extrabold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── App Reviews & Testimonials Section (USER REQUESTED) ──────────── */}
      <section id="reviews" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold mb-4">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>4.9 / 5 Rating from Verified Pharmacy Owners</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by 500+ Pharmacy Owners Across India
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Here is what medical store owners, pharmacists, and drug distributors have to say about using Pharmora.
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-2xl relative"
              >
                {/* Rating Stars & Feature Badge */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      Used: {rev.featureUsed}
                    </span>
                  </div>

                  {/* Review text */}
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed italic">
                    "{rev.review}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${rev.avatarBg} border flex items-center justify-center font-black text-base`}>
                    {rev.initials}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base">{rev.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">{rev.role}</p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">{rev.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-2">
              Simple 3-Step Setup
            </h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Start Managing Your Pharmacy in 2 Minutes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xl font-black flex items-center justify-center mx-auto mb-6">
                1
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Create Free Account</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Register your pharmacy store name, phone number, and owner details in under 30 seconds.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xl font-black flex items-center justify-center mx-auto mb-6">
                2
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Add Cash & Borrowed Money</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Record daily cashbook entries, lender loans, bank balances, and distributor purchase bills.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xl font-black flex items-center justify-center mx-auto mb-6">
                3
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Track & Scale Profitably</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive target due date alerts, export accounting reports, and manage borrowings with zero mistakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest mb-2">
              Got Questions?
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between font-extrabold text-white text-base sm:text-lg focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${
                      activeFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 sm:p-14 text-center shadow-2xl shadow-emerald-500/20 overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              Take Control of Your Pharmacy Finances Today
            </h2>
            <p className="mt-4 text-slate-900 font-semibold text-base sm:text-lg max-w-2xl mx-auto">
              Join 500+ pharmacy owners managing their daily cashbook, distributor debt ledgers, and borrowed money effortlessly.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-8 py-4 rounded-2xl font-black text-base bg-slate-950 text-white hover:bg-slate-900 transition-all shadow-xl flex items-center gap-2"
                >
                  <span>Go to Store Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-2xl font-black text-base bg-slate-950 text-white hover:bg-slate-900 transition-all shadow-xl flex items-center gap-2"
                >
                  <span>Start Managing Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <Pill size={18} />
            </div>
            <span className="font-extrabold text-sm text-white">Pharmora Business Manager</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#features" className="hover:text-slate-200">
              Features
            </a>
            <a href="#reviews" className="hover:text-slate-200">
              Reviews
            </a>
            <a href="#faq" className="hover:text-slate-200">
              FAQ
            </a>
            <Link to="/login" className="hover:text-slate-200">
              Log In
            </Link>
            <Link to="/register" className="hover:text-slate-200">
              Register
            </Link>
          </div>

          <div>© {new Date().getFullYear()} Pharmora. All rights reserved. Built for Pharmacy Owners.</div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
