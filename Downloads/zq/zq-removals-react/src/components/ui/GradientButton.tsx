import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-white text-black hover:bg-gray-100',
      secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
      outline: 'bg-transparent text-white border border-white/20 hover:bg-white/5'
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative px-6 py-3 rounded-full font-medium transition-colors duration-300 flex items-center justify-center gap-2 overflow-hidden',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
GradientButton.displayName = 'GradientButton';