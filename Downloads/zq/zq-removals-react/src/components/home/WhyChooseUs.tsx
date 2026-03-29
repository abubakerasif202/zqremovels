import { SectionHeading } from '../ui/SectionHeading';
import { motion } from 'framer-motion';

const features = [
  {
    number: '01',
    title: 'Meticulous Care',
    desc: 'Every item is wrapped, padded, and secured using premium materials before transit.'
  },
  {
    number: '02',
    title: 'Transparent Pricing',
    desc: 'Clear, upfront quotes with absolutely no hidden fees or unexpected surcharges.'
  },
  {
    number: '03',
    title: 'Expert Team',
    desc: 'Our staff are rigorously trained, fully vetted, and committed to excellence.'
  }
];

export function WhyChooseUs() {
  return (
    <section className="py-24 md:py-32 border-t border-white/5">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <SectionHeading 
              subtitle="The ZQ Standard"
              title="Elevating the Industry Standard."
              className="mb-8"
            />
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              We don't just move boxes; we transition lives. Our approach combines logistical precision with hospitality-level service to deliver an unmatched moving experience.
            </p>
          </div>
          
          <div className="flex flex-col gap-10">
            {features.map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="flex gap-6 group"
              >
                <div className="text-4xl md:text-5xl font-light text-zinc-700 group-hover:text-white transition-colors duration-300">
                  {feat.number}
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">{feat.title}</h4>
                  <p className="text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}