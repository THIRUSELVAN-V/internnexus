import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/formatters';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-blue-50 text-blue-700 border-blue-200',
        secondary: 'bg-slate-100 text-slate-600 border-slate-200',
        success: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        destructive: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        ai: 'bg-gradient-to-r from-indigo-50 to-sky-50 text-indigo-700 border-indigo-200',
        outline: 'bg-transparent text-slate-700 border-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
