'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/_0.04)] hover:shadow-[0_4px_16px_rgb(37_99_235/_0.06)] hover:border-slate-300 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-5.5 w-5.5', iconColor)} />
          </div>
        )}
      </div>

      {(change || description) && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          {change && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold rounded-full px-2 py-0.5',
                trend === 'up' && 'bg-green-50 text-green-700',
                trend === 'down' && 'bg-red-50 text-red-700',
                trend === 'neutral' && 'bg-slate-100 text-slate-600'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'neutral' && <Minus className="h-3 w-3" />}
              {change}
            </span>
          )}
          {description && <span className="text-slate-500 truncate">{description}</span>}
        </div>
      )}
    </motion.div>
  );
}
