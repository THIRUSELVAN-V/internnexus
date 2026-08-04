'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, FileText, Search, ClipboardList,
  GraduationCap, CheckSquare, Upload, TrendingUp, Award,
  Settings, Building2, Briefcase, Users, UserCheck, Activity,
  BarChart3, Sparkles, Inbox, MessageSquare, Star,
  ShieldCheck, FileBarChart, X, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/formatters';
import type { UserRole } from '@/lib/types';
import {
  STUDENT_NAV_ITEMS, HR_NAV_ITEMS, MENTOR_NAV_ITEMS, ADMIN_NAV_ITEMS
} from '@/lib/utils/constants';

// Icon map
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, User, FileText, Search, ClipboardList,
  GraduationCap, CheckSquare, Upload, TrendingUp, Award,
  Settings, Building2, Briefcase, Users, UserCheck, Activity,
  BarChart3, Sparkles, Inbox, MessageSquare, Star,
  ShieldCheck, FileBarChart,
};

const ROLE_NAV: Record<UserRole, typeof STUDENT_NAV_ITEMS> = {
  student: STUDENT_NAV_ITEMS,
  hr: HR_NAV_ITEMS,
  mentor: MENTOR_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student Portal',
  hr: 'HR Portal',
  mentor: 'Mentor Portal',
  admin: 'Admin Console',
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: 'bg-blue-50 text-blue-700',
  hr: 'bg-purple-50 text-purple-700',
  mentor: 'bg-green-50 text-green-700',
  admin: 'bg-rose-50 text-rose-700',
};

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const navItems = ROLE_NAV[role] ?? [];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : undefined }}
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col',
          'bg-white border-r border-slate-200',
          // Mobile: slide in/out
          'max-lg:transition-transform max-lg:duration-300',
          isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">InternNexus</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-4 pt-4 pb-2">
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', ROLE_COLORS[role])}>
            {ROLE_LABELS[role]}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navItems.map((item, index) => {
            const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
            const isActive =
              pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 my-0.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">AI Powered</span>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">
              AI assists with analysis & recommendations. Decisions remain with you.
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
