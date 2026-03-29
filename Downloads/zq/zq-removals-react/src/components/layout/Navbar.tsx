import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Phone, Menu, X } from 'lucide-react';
import { GradientButton } from '../ui/GradientButton';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'py-4' : 'py-6'
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className={cn(
          'flex items-center justify-between rounded-full px-6 py-3 transition-all duration-300',
          isScrolled ? 'glass shadow-lg' : 'bg-transparent'
        )}>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tighter text-white">
              ZQ<span className="text-zinc-500">.</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Services', 'About', 'Testimonials'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a href="tel:1300000000" className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              <Phone size={16} />
              <span>1300 000 000</span>
            </a>
            <GradientButton variant="primary" className="py-2 px-5 text-sm">
              Get a Quote
            </GradientButton>
          </div>

          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-4 right-4 mt-2 p-6 glass rounded-3xl flex flex-col gap-4 md:hidden"
        >
          {['Services', 'About', 'Testimonials'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-lg font-medium text-zinc-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="h-[1px] bg-white/10 w-full my-2" />
          <GradientButton variant="primary" className="w-full">
            Get a Quote
          </GradientButton>
        </motion.div>
      )}
    </motion.header>
  );
}