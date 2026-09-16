'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  badgeText?: string;
  action?: React.ReactNode;
  gradient?: string;
}

export default function AdminPageHeader({
  title,
  description,
  icon: Icon,
  badgeText,
  action,
  gradient = 'from-slate-900 to-rose-900',
}: AdminPageHeaderProps) {
  return (
    <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
      <div className="space-y-1">
        {badgeText && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {badgeText}
          </span>
        )}
        <h1 style={{ color: 'white' }} className="text-2xl font-bold tracking-tight">
          {title}
        </h1>
        <p style={{ color: 'white' }} className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
