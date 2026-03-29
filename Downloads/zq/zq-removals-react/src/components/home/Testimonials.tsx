import { GlassCard } from '../ui/GlassCard';
import { SectionHeading } from '../ui/SectionHeading';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../motion/MotionPresets';
import { Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Sarah Jenkins',
    role: 'Homeowner, Burnside',
    text: 'Absolutely flawless experience. The team treated our antique furniture with incredible respect. Worth every cent for the peace of mind.'
  },
  {
    name: 'Marcus Chen',
    role: 'CEO, TechFlow',
    text: 'Relocating our entire office over a weekend seemed impossible, but ZQ executed it with military precision. Highly recommended for corporate moves.'
  },
  {
    name: 'Elena Rostova',
    role: 'Interstate Relocation',
    text: 'From Adelaide to Melbourne, the communication was stellar. Everything arrived in pristine condition. A truly premium service.'
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          subtitle="Client Feedback"
          title="Trusted by those who expect the best."
          centered
        />
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {reviews.map((review, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <GlassCard className="h-full relative overflow-hidden">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-white/5" />
                <p className="text-zinc-300 text-lg leading-relaxed mb-8 relative z-10">
                  "{review.text}"
                </p>
                <div>
                  <h5 className="font-semibold text-white">{review.name}</h5>
                  <p className="text-sm text-zinc-500">{review.role}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}