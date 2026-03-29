import { Package, Truck, Home, Building2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { SectionHeading } from '../ui/SectionHeading';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../motion/MotionPresets';

const services = [
  {
    icon: <Home className="w-6 h-6" />,
    title: 'Residential Moves',
    description: 'White-glove relocation for luxury homes and apartments. We handle your prized possessions with absolute care.'
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Corporate Relocation',
    description: 'Minimal downtime. Maximum efficiency. Tailored moving solutions for modern businesses and executive offices.'
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: 'Interstate Transit',
    description: 'Dedicated premium transport across Australia. Tracked, secure, and delivered exactly when promised.'
  },
  {
    icon: <Package className="w-6 h-6" />,
    title: 'Valet Packing',
    description: 'Comprehensive packing and unpacking services using industry-leading protective materials and techniques.'
  }
];

export function Services() {
  return (
    <section id="services" className="py-24 md:py-32 relative">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeading 
          subtitle="Our Expertise"
          title="Tailored Moving Solutions"
        />
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((service, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <GlassCard className="h-full hover:bg-white/10 transition-colors duration-500 group cursor-pointer">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {service.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}