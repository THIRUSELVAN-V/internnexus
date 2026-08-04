'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserRole } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuthContext();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-[260px] flex-col border-r border-slate-200 bg-white p-4 gap-3">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-28" />
          </div>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        {/* Main skeleton */}
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-16 w-full rounded-none" />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar
        role={profile.role as UserRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:ml-[260px] min-w-0">
        <Header
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <motion.main
          key={typeof window !== 'undefined' ? window.location.pathname : 'main'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-5 lg:p-7"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
