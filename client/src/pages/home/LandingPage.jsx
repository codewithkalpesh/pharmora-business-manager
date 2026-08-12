// src/pages/home/LandingPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  Pill, HandCoins, BookOpen, Building2, TrendingUp, ShieldCheck,
  Star, CheckCircle2, ArrowRight, ChevronDown, Award, BarChart3, Clock,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
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
      avatarBg: 'rgba(16, 185, 129, 0.15)',
      avatarColor: '#10b981',
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
      avatarBg: 'rgba(6, 182, 212, 0.15)',
      avatarColor: '#06b6d4',
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
      avatarBg: 'rgba(245, 158, 11, 0.15)',
      avatarColor: '#f59e0b',
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
      avatarBg: 'rgba(59, 130, 246, 0.15)',
      avatarColor: '#3b82f6',
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
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      description:
        'Record daily cash-in, cash-out, UPI transactions, and reconcile opening vs closing balance with zero manual errors.',
    },
    {
      icon: HandCoins,
      title: 'Borrowed Money & Repayments',
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.25)',
      description:
        'Track money borrowed from lenders, manage partial repayments, auto-compute target payback, and borrow again seamlessly.',
    },
    {
      icon: Building2,
      title: 'Multi-Bank Account Sync',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.25)',
      description:
        'Connect HDFC, ICICI, SBI, Axis, and custom accounts. Monitor realtime account balances and transaction histories.',
    },
    {
      icon: TrendingUp,
      title: 'Distributor & Bill Ledgers',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.25)',
      description:
        'Maintain complete supplier profiles, pending purchase bills, due date alerts, and credit payment history.',
    },
    {
      icon: Award,
      title: 'Financial Payment Goals',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      description:
        'Set target deadlines to pay off major debts or distributor bills with live progress trackers and status indicators.',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics & Reports',
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.1)',
      border: 'rgba(244, 63, 94, 0.25)',
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#020617',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      lineHeight: 1.5,
    }}>
      {/* ─── Top Navbar ────────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
            }}>
              <Pill size={22} color="#020617" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Pharmo<span style={{ color: '#10b981' }}>ra</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '-3px' }}>
                Business Manager
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#features" style={{ textDecoration: 'none', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>
              Features
            </a>
            <a href="#reviews" style={{ textDecoration: 'none', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Reviews</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.6875rem',
                fontWeight: 800,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}>
                4.9 ★
              </span>
            </a>
            <a href="#how-it-works" style={{ textDecoration: 'none', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>
              How It Works
            </a>
            <a href="#faq" style={{ textDecoration: 'none', color: '#cbd5e1', fontSize: '0.875rem', fontWeight: 600 }}>
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#020617',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                }}
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    textDecoration: 'none',
                  }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#020617',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        paddingTop: '64px',
        paddingBottom: '96px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(2, 6, 23, 0) 70%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: '#34d399',
            marginBottom: '32px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>
            <Sparkles size={16} color="#34d399" />
            <span>#1 Financial & Borrowed Money System for Pharmacy Owners</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            maxWidth: '960px',
            margin: '0 auto',
          }}>
            Manage Cash Flow, Track{' '}
            <span style={{
              background: 'linear-gradient(135deg, #34d399, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Borrowed Money
            </span>{' '}
            & Scale Your Pharmacy.
          </h1>

          {/* Subtitle */}
          <p style={{
            marginTop: '24px',
            fontSize: '1.125rem',
            color: '#94a3b8',
            maxWidth: '780px',
            margin: '24px auto 0',
            lineHeight: 1.6,
          }}>
            Built specifically for Indian medical store owners and pharmacy managers. Track daily cashbook entries, distributor debt ledgers, bank balances, and borrow money from lenders with automated payback calculations.
          </p>

          {/* CTAs */}
          <div style={{
            marginTop: '40px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                style={{
                  padding: '16px 36px',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  background: '#10b981',
                  color: '#020617',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 12px 32px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>Open Pharmacy Dashboard</span>
                <ArrowRight size={20} />
              </Link>
            ) : (
              <Link
                to="/register"
                style={{
                  padding: '16px 36px',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  background: '#10b981',
                  color: '#020617',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 12px 32px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>Get Started Free</span>
                <ArrowRight size={20} />
              </Link>
            )}
            <a
              href="#reviews"
              style={{
                padding: '16px 32px',
                borderRadius: '16px',
                fontSize: '1rem',
                fontWeight: 700,
                background: '#0f172a',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                color: '#f1f5f9',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
              <span>Read Pharmacy Owner Reviews</span>
            </a>
          </div>

          {/* Trust Metrics */}
          <div style={{
            marginTop: '64px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            maxWidth: '900px',
            margin: '64px auto 0',
          }}>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#34d399' }}>500+</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>Active Medical Stores</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#22d3ee' }}>₹10Cr+</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>Managed Transactions</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fbbf24' }}>4.9 ★</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>User Review Score</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#c084fc' }}>99.9%</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginTop: '4px' }}>Data Reliability</div>
            </div>
          </div>

          {/* Interactive Live Preview Card */}
          <div style={{
            marginTop: '64px',
            borderRadius: '24px',
            background: '#0f172a',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            padding: '24px',
            textAlign: 'left',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '10px', fontFamily: 'monospace' }}>
                  pharmora-business-manager.app / borrowed
                </span>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> Verified Live System Preview
              </span>
            </div>

            {/* Mock KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Borrowed</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>₹1,28,600</div>
                <span style={{ fontSize: '0.6875rem', color: '#06b6d4', fontWeight: 700, marginTop: '4px', display: 'block' }}>2 Active Lenders</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Target Payback</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>₹1,28,600</div>
                <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 600, marginTop: '4px', display: 'block' }}>Auto-combined payback</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Repaid</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>₹46,748</div>
                <span style={{ fontSize: '0.6875rem', color: '#34d399', fontWeight: 700, marginTop: '4px', display: 'block' }}>Synced to Cashbook</span>
              </div>
              <div style={{ padding: '16px', borderRadius: '16px', background: '#020617', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Remaining Due</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>₹81,852</div>
                <span style={{ fontSize: '0.6875rem', color: '#f87171', fontWeight: 700, marginTop: '4px', display: 'block' }}>Payment Reminders Active</span>
              </div>
            </div>

            {/* Borrower row sample preview */}
            <div style={{ marginTop: '20px', borderRadius: '16px', background: '#020617', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justify: 'space-between' }}>
                <span>Recent Borrowed Money Records</span>
                <span style={{ color: '#06b6d4', fontWeight: 800 }}>+ Borrow Again Feature Enabled</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9375rem' }}>Vikas Patil</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '8px' }}>+91 9158501691</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', fontWeight: 700 }}>
                  <span style={{ color: '#cbd5e1' }}>Borrowed: ₹73,600</span>
                  <span style={{ color: '#34d399' }}>Paid: ₹33,420</span>
                  <span style={{ color: '#f87171', fontWeight: 900 }}>Remaining: ₹40,180</span>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.6875rem', fontWeight: 800, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                    + Borrow Again
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Features Section ─────────────────────────────────────────── */}
      <section id="features" style={{
        paddingTop: '96px',
        paddingBottom: '96px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Everything Your Pharmacy Needs
            </h2>
            <h3 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Powerful Features Designed for Retail Medical Stores
            </h3>
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '1rem' }}>
              Replace messy paper logbooks and complex desktop accounting software with a modern, fast, web app.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '32px',
                    borderRadius: '24px',
                    background: '#0f172a',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: feat.bg,
                    border: `1px solid ${feat.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                  }}>
                    <IconComp size={28} color={feat.color} />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
                    {feat.title}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── App Reviews & Testimonials Section (USER REQUESTED) ──────────── */}
      <section id="reviews" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <span>4.9 / 5 Rating from Verified Pharmacy Owners</span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Loved by 500+ Pharmacy Owners Across India
            </h2>
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '1rem' }}>
              Here is what medical store owners, pharmacists, and drug distributors have to say about using Pharmora.
            </p>
          </div>

          {/* Reviews Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}>
            {reviews.map((rev, idx) => (
              <div
                key={idx}
                style={{
                  padding: '32px',
                  borderRadius: '24px',
                  background: '#0f172a',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                {/* Rating Stars & Feature Badge */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#cbd5e1', background: '#020617', padding: '4px 12px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Used: {rev.featureUsed}
                    </span>
                  </div>

                  {/* Review text */}
                  <p style={{ color: '#e2e8f0', fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{rev.review}"
                  </p>
                </div>

                {/* Author Info */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: rev.avatarBg,
                    border: `1px solid ${rev.avatarColor}`,
                    color: rev.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1rem',
                  }}>
                    {rev.initials}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>{rev.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{rev.role}</p>
                    <p style={{ fontSize: '0.6875rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>{rev.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        paddingTop: '96px',
        paddingBottom: '96px',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Simple 3-Step Setup
            </h2>
            <h3 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Start Managing Your Pharmacy in 2 Minutes
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '32px', borderRadius: '24px', background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 24px' }}>
                1
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>Create Free Account</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Register your pharmacy store name, phone number, and owner details in under 30 seconds.
              </p>
            </div>

            <div style={{ padding: '32px', borderRadius: '24px', background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 24px' }}>
                2
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>Add Cash & Borrowed Money</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Record daily cashbook entries, lender loans, bank balances, and distributor purchase bills.
              </p>
            </div>

            <div style={{ padding: '32px', borderRadius: '24px', background: '#0f172a', border: '1.5px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 24px' }}>
                3
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>Track & Scale Profitably</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Receive target due date alerts, export accounting reports, and manage borrowings with zero mistakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Got Questions?
            </h2>
            <h3 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#ffffff' }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '16px',
                  background: '#0f172a',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 800,
                    color: '#ffffff',
                    fontSize: '1rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color="#34d399"
                    style={{
                      transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms ease',
                    }}
                  />
                </button>
                {activeFaq === idx && (
                  <div style={{ padding: '0 24px 24px', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: '64px', paddingBottom: '96px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            borderRadius: '32px',
            background: 'linear-gradient(135deg, #059669, #0891b2)',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
          }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#020617', letterSpacing: '-0.02em' }}>
              Take Control of Your Pharmacy Finances Today
            </h2>
            <p style={{ marginTop: '16px', color: '#020617', fontWeight: 700, fontSize: '1.125rem', maxWidth: '650px', margin: '16px auto 0' }}>
              Join 500+ pharmacy owners managing their daily cashbook, distributor debt ledgers, and borrowed money effortlessly.
            </p>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  style={{
                    padding: '16px 36px',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    background: '#020617',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <span>Go to Store Dashboard</span>
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  style={{
                    padding: '16px 36px',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    background: '#020617',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <span>Start Managing Free</span>
                  <ArrowRight size={20} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#020617', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '48px 0 32px', color: '#94a3b8', fontSize: '0.8125rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pill size={18} color="#020617" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.9375rem', color: '#ffffff' }}>Pharmora Business Manager</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontWeight: 600 }}>
            <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              Features
            </a>
            <a href="#reviews" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              Reviews
            </a>
            <a href="#faq" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              FAQ
            </a>
            <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
              Log In
            </Link>
            <Link to="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
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
