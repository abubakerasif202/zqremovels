import { motion } from 'framer-motion';

const brands = [
  { name: 'AFRA Member', id: 1 },
  { name: 'Fully Insured', id: 2 },
  { name: '5-Star Rated', id: 3 },
  { name: 'Premium Fleet', id: 4 },
  { name: 'Secure Storage', id: 5 },
];

export function TrustBar() {
  return (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-sm md:text-base font-semibold tracking-widest uppercase text-zinc-400 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 hidden md:block" />
              {brand.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}