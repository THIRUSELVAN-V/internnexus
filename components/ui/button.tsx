import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/formatters';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:-translate-y-px hover:shadow-[0_4px_12px_rgb(37_99_235_/_0.25)]',
        secondary:
          'bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 hover:border-slate-300',
        outline:
          'bg-transparent text-blue-600 border border-blue-200 hover:bg-blue-50',
        ghost:
          'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900',
        destructive:
          'bg-red-600 text-white border border-red-600 hover:bg-red-700',
        success:
          'bg-green-600 text-white border border-green-600 hover:bg-green-700',
        link: 'text-blue-600 underline-offset-4 hover:underline bg-transparent border-transparent p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md',
        default: 'h-9 px-4',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
