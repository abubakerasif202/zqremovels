import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { fadeInUp } from '../motion/MotionPresets';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({ title, subtitle, centered = false, className }: SectionHeadingProps) {
  return (
    <motion.div 
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn('mb-12 md:mb-20', centered && 'text-center', className)}
    >
      {subtitle && (
        <span className="text-sm md:text-base font-semibold tracking-wider uppercase text-muted mb-4 block">
          {subtitle}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gradient-accent">
        {title}
      </h2>
    </motion.div>
  );
}