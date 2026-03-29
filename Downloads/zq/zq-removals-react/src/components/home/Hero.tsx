import { motion } from 'framer-motion';
import { ArrowRight, Star, ShieldCheck, Clock } from 'lucide-react';
import { GradientButton } from '../ui/GradientButton';
import { GlassCard } from '../ui/GlassCard';
import { fadeInUp, staggerContainer, scaleUp } from '../motion/MotionPresets';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium tracking-wide text-zinc-300 uppercase">Premium Relocation Services</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Move with <br/>
              <span className="text-gradient-accent">Uncompromising</span> <br/>
              Quality.
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed">
              Experience the pinnacle of relocation. White-glove service, meticulous care, and absolute peace of mind for your home or office.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <GradientButton className="h-14 px-8 text-base">
                Request a Quote
                <ArrowRight className="w-4 h-4 ml-1" />
              </GradientButton>
              <GradientButton variant="secondary" className="h-14 px-8 text-base">
                Our Services
              </GradientButton>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <GlassCard className="w-full max-w-md aspect-[4/5] relative overflow-hidden p-0 border-white/20">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Premium Interior" 
                className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Available for bookings</span>
                </div>
                <h3 className="text-2xl font-bold">Adelaide & Interstate</h3>
              </div>
            </GlassCard>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="absolute -bottom-6 -left-6 sm:bottom-10 sm:-left-12"
            >
              <GlassCard heavy className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$10M</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">Fully Insured</p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute -top-6 -right-6 sm:top-10 sm:-right-8"
            >
              <GlassCard heavy className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">99.8%</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">On-Time Rate</p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}