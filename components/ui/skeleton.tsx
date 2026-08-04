import * as React from 'react';
import { cn } from '@/lib/utils/formatters';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-slate-100',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
