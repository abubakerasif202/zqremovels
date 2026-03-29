import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        <label htmlFor={id} className="text-sm font-medium text-zinc-400 pl-1">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
InputField.displayName = 'InputField';