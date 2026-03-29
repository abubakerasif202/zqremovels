import { GlassCard } from '../ui/GlassCard';
import { InputField } from '../ui/InputField';
import { GradientButton } from '../ui/GradientButton';
import { motion } from 'framer-motion';

export function QuoteForm() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard heavy className="p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-600/20 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="mb-10 relative z-10">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Request a Consultation</h3>
                <p className="text-zinc-400">Provide your details and our team will craft a personalized relocation plan.</p>
              </div>

              <form className="grid md:grid-cols-2 gap-6 relative z-10">
                <InputField label="Full Name" id="name" placeholder="John Doe" />
                <InputField label="Email Address" id="email" type="email" placeholder="john@example.com" />
                <InputField label="Moving From (Suburb/Postcode)" id="from" placeholder="Adelaide 5000" />
                <InputField label="Moving To (Suburb/Postcode)" id="to" placeholder="Sydney 2000" />
                
                <div className="md:col-span-2">
                  <GradientButton className="w-full h-14 text-lg mt-4">
                    Submit Request
                  </GradientButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}