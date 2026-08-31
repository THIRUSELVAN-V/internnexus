'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, Variants } from 'framer-motion';
import {
  Zap, ArrowRight, CheckCircle2, Star, Users, Briefcase,
  TrendingUp, Award, Brain, Target, Sparkles, Shield,
  FileText, UserCheck, BarChart3, ChevronRight, Menu, X,
  Building2, GraduationCap, Cpu, Globe, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Animation variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Stats Counter ────────────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold text-slate-900 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1.5 text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(37_99_235_/_0.08)] transition-all duration-300"
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function TestimonialCard({ quote, author, role, company, initials }: {
  quote: string; author: string; role: string; company: string; initials: string;
}) {
  return (
    <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{author}</p>
          <p className="text-xs text-slate-500">{role} · {company}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">InternNexus</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How it Works', 'For Companies', 'Testimonials'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/register">Get Started <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-slate-100 bg-white px-5 py-4 flex flex-col gap-3">
            {['Features', 'How it Works', 'Testimonials'].map((item) => (
              <a key={item} href="#" className="text-sm text-slate-700 font-medium py-1.5">{item}</a>
            ))}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" asChild className="flex-1"><Link href="/login">Sign in</Link></Button>
              <Button asChild className="flex-1"><Link href="/register">Get Started</Link></Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 px-5 overflow-hidden" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37, 99, 235, 0.07) 0%, transparent 70%)' }}>
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Internship Management
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6"
          >
            The Smart Platform for{' '}
            <span className="text-blue-600">Internship</span> Excellence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            InternNexus connects students, HR managers, and industrial mentors through
            AI-assisted workflows — from application to certificate generation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="xl" asChild>
              <Link href="/register">Start Free Today <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="xl" variant="secondary" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
          >
            {['No credit card required', 'Set up in 5 minutes', 'Enterprise-grade security'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> {item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Hero Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgb(0,0,0,0.08)] overflow-hidden">
            {/* Browser bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 rounded-md bg-white border border-slate-200 px-3 py-1">
                <span className="text-xs text-slate-400">internnexus.app/student/dashboard</span>
              </div>
            </div>
            {/* Dashboard preview */}
            <div className="grid grid-cols-12 gap-0">
              {/* Sidebar */}
              <div className="col-span-2 border-r border-slate-100 bg-white p-3 hidden sm:block">
                <div className="flex items-center gap-1.5 mb-4 px-2">
                  <div className="h-5 w-5 rounded bg-blue-600" />
                  <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
                {[...Array(7)].map((_, i) => (
                  <div key={i} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-1 ${i === 0 ? 'bg-blue-50' : ''}`}>
                    <div className={`h-3 w-3 rounded ${i === 0 ? 'bg-blue-400' : 'bg-slate-200'}`} />
                    <div className={`h-2.5 rounded ${i === 0 ? 'bg-blue-200 w-14' : 'bg-slate-100 w-12'}`} />
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-12 sm:col-span-10 p-5 bg-slate-50">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Applications', value: '8', color: 'bg-blue-50' },
                    { label: 'Tasks Done', value: '12', color: 'bg-green-50' },
                    { label: 'Match Score', value: '94%', color: 'bg-purple-50' },
                    { label: 'Progress', value: '68%', color: 'bg-amber-50' },
                  ].map((card) => (
                    <div key={card.label} className={`rounded-xl ${card.color} border border-white p-3`}>
                      <div className="text-lg font-bold text-slate-900">{card.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 rounded-xl bg-white border border-slate-200 p-4">
                    <div className="h-3 w-24 rounded bg-slate-200 mb-3" />
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-blue-100" style={{ height: `${h}%` }}>
                          {i === 5 && <div className="rounded-sm bg-blue-500 h-full" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <div className="h-3 w-16 rounded bg-slate-200 mb-3" />
                    <div className="space-y-2">
                      {['Resume AI', 'Matching', 'Task AI'].map((item, i) => (
                        <div key={item} className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                          </div>
                          <div className="h-2 flex-1 rounded bg-slate-100">
                            <div className={`h-full rounded bg-purple-300`} style={{ width: `${[85, 92, 78][i]}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-16 px-5">
        <div className="mx-auto max-w-4xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-10"
          >
            <StatCounter value={12500} label="Students Placed" suffix="+" />
            <StatCounter value={450} label="Partner Companies" suffix="+" />
            <StatCounter value={98} label="Satisfaction Rate" suffix="%" />
            <StatCounter value={2400} label="Mentors Active" suffix="+" />
          </motion.div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-4">
                <Brain className="h-3.5 w-3.5" /> AI Features
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              AI That Works For You,<br />Not Instead of You
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base text-slate-500 max-w-xl mx-auto">
              Every AI feature is designed to assist human decision-makers — never replace them.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[
              {
                icon: FileText, title: 'Resume Analysis', color: 'bg-blue-50 text-blue-600',
                description: 'AI extracts skills, projects, education, experience and generates a structured resume summary card.'
              },
              {
                icon: Target, title: 'Candidate Matching', color: 'bg-purple-50 text-purple-600',
                description: 'Compares student profiles against internship requirements to show match score, matched skills, and missing skills.'
              },
              {
                icon: UserCheck, title: 'Mentor Recommendation', color: 'bg-green-50 text-green-600',
                description: 'Recommends the best mentor based on domain expertise, current workload, and student skills. HR makes the final call.'
              },
              {
                icon: Sparkles, title: 'Task Generation', color: 'bg-amber-50 text-amber-600',
                description: 'Generates structured weekly internship tasks tailored to the domain. Mentors review and edit before publishing.'
              },
              {
                icon: BarChart3, title: 'Submission Analysis', color: 'bg-rose-50 text-rose-600',
                description: 'Analyzes submitted PDFs, ZIP files and code to generate summaries, flag missing sections, and provide suggestions.'
              },
              {
                icon: Shield, title: 'AI Guardrails', color: 'bg-slate-100 text-slate-600',
                description: 'AI never auto-approves candidates or submissions. Every AI output is a recommendation pending human review.'
              },
            ].map((feat) => <FeatureCard key={feat.title} {...feat} />)}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              Complete Internship Lifecycle
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 max-w-lg mx-auto">
              From first application to certificate download — every step managed in one platform.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { step: '01', icon: Users, title: 'Student Registers & Applies', desc: 'Student creates profile, uploads resume, and browses AI-matched internship listings.' },
              { step: '02', icon: Brain, title: 'AI Resume & Matching Analysis', desc: 'AI analyzes resume and calculates match scores against internship requirements.' },
              { step: '03', icon: UserCheck, title: 'HR Reviews & Assigns Mentor', desc: 'HR shortlists candidates using AI insights and assigns mentors from AI recommendations.' },
              { step: '04', icon: Sparkles, title: 'AI Task Generation', desc: 'Mentor receives weekly AI-generated task suggestions, edits them, and publishes to student.' },
              { step: '05', icon: Award, title: 'Submissions & Evaluation', desc: 'Student submits work. AI analyzes submissions. Mentor reviews, approves, and gives feedback.' },
              { step: '06', icon: TrendingUp, title: 'Certificate Generation', desc: 'Successful interns receive auto-generated certificates upon completion and final evaluation.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.step} variants={fadeUp} className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1">Step {item.step}</div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── For Companies / Roles ────────────────────────────────────────────── */}
      <section id="for-companies" className="py-24 px-5">
        <div className="mx-auto max-w-6xl">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              Built for Every Stakeholder
            </motion.h2>
            <motion.p variants={fadeUp} className="text-slate-500 max-w-lg mx-auto">
              Four distinct portals — each designed for the exact needs of that role.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              {
                icon: GraduationCap, role: 'Student', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-700',
                features: ['AI Resume Analysis', 'Smart Job Matching', 'Task Submissions', 'Progress Tracking', 'Certificate Download']
              },
              {
                icon: Building2, role: 'HR Manager', color: 'bg-purple-600', light: 'bg-purple-50 text-purple-700',
                features: ['Internship Postings', 'AI Candidate Ranking', 'Mentor Assignment', 'Intern Monitoring', 'Certificate Generation']
              },
              {
                icon: UserCheck, role: 'Mentor', color: 'bg-green-600', light: 'bg-green-50 text-green-700',
                features: ['Assigned Students View', 'AI Task Generator', 'Submission Review', 'Feedback Forms', 'Final Evaluation']
              },
              {
                icon: Shield, role: 'Admin', color: 'bg-rose-600', light: 'bg-rose-50 text-rose-700',
                features: ['Company Approvals', 'User Management', 'System Analytics', 'Audit Reports', 'Platform Settings']
              },
            ].map((role) => {
              const Icon = role.icon;
              return (
                <motion.div key={role.role} variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className={`h-10 w-10 rounded-xl ${role.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${role.light}`}>
                    {role.role}
                  </div>
                  <ul className="space-y-2">
                    {role.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-5 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-slate-900 mb-4">
              Trusted by Leading Organizations
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <TestimonialCard
              quote="InternNexus transformed how we manage our intern cohort. The AI matching saved us 60% of screening time while improving candidate quality."
              author="Priya Sharma"
              role="HR Manager"
              company="TechCorp India"
              initials="PS"
            />
            <TestimonialCard
              quote="The AI task generator is incredible. I edit the suggestions slightly and publish — it's saved me hours every week while keeping tasks structured."
              author="Mr. Vijay"
              role="Senior Mentor"
              company="Infosys"
              initials="RK"
            />
            <TestimonialCard
              quote="Got matched to my dream internship because of the 94% AI match score. The progress tracking and instant feedback from my mentor was outstanding."
              author="Ananya Krishnan"
              role="Student"
              company="IIT Madras"
              initials="AK"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 mb-6">
                <Zap className="h-3.5 w-3.5" /> Get Started Today
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Ready to Transform<br />Your Internship Program?
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-slate-500 mb-10 max-w-lg mx-auto">
              Join thousands of students, companies, and mentors already using InternNexus.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="xl" asChild>
                <Link href="/register">Create Free Account <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="xl" variant="secondary" asChild>
                <Link href="/login">Sign In Instead</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-bold text-slate-900">InternNexus</span>
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                AI-powered internship management connecting students, companies, and mentors.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'AI Capabilities', 'Security', 'Pricing'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">© 2026 InternNexus. All rights reserved.</p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              Built with <span className="text-rose-500">♥</span> for better internship experiences
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
