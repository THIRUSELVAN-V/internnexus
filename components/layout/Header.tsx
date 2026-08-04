'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn, getInitials } from '@/lib/utils/formatters';
import { signOut } from '@/lib/firebase/auth';
import type { UserProfile } from '@/lib/types';

interface HeaderProps {
  profile: UserProfile | null;
  onMenuClick: () => void;
  title?: string;
}

const mockNotifications = [
  { id: '1', title: 'New task assigned', message: 'Week 3 task has been assigned', time: '2m ago', read: false },
  { id: '2', title: 'Application shortlisted', message: 'You\'ve been shortlisted for TechCorp', time: '1h ago', read: false },
  { id: '3', title: 'Feedback received', message: 'Mentor left feedback on your submission', time: '3h ago', read: true },
];

export default function Header({ profile, onMenuClick, title }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const roleHref = profile?.role ? `/${profile.role}/settings` : '#';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 backdrop-blur px-5 lg:px-6">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-slate-900 hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">Notifications</span>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {mockNotifications.map((n) => (
                      <div key={n.id} className={cn('px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors', !n.read && 'bg-blue-50/40')}>
                        <div className="flex items-start gap-2.5">
                          {!n.read && <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                          <div className={cn(!n.read && 'ml-0', n.read && 'ml-4')}>
                            <p className="text-sm font-medium text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 p-3 text-center">
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">View all notifications</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.photoURL ?? ''} alt={profile?.displayName ?? 'User'} />
                <AvatarFallback className="text-xs">
                  {getInitials(profile?.displayName ?? 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 leading-tight">
                  {profile?.displayName ?? 'User'}
                </p>
                <p className="text-[11px] text-slate-500 capitalize">{profile?.role ?? ''}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={roleHref.replace('settings', 'profile')} className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={roleHref} className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
