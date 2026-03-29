import Button from '../components/Button';

const services = [
  { title: 'Bespoke Local Moves', copy: 'Concierge planning for townhouse and estate relocations with fixed-price clarity.' },
  { title: 'Long-Distance Logistics', copy: 'Interstate moves with climate-aware routing and tightly managed schedules.' },
  { title: 'Curated Packing', copy: 'White-glove packing for art, archives, and heirlooms with dedicated specialists.' }
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-4 space-y-16">
      <section className="pt-12 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">ZQ Removals</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-espresso leading-tight">Your World, Carefully Moved</h1>
          <p className="text-base text-espresso/80 max-w-xl">
            Concierge-style planning for your most precious belongings, with fixed-price peace of mind and discreet execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button>Get Your Premium Quote</Button>
            <Button variant="ghost">Call Our Concierge</Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-6 -right-6 -bottom-6 -left-8 bg-espresso/90 rounded-sm" />
          <div className="relative h-72 bg-gradient-to-br from-espresso/80 to-espresso/60 rounded-sm" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif font-semibold text-espresso">Services</h2>
        <div className="space-y-4">
          {services.map((s) => (
            <div key={s.title} className="bg-white border border-espresso/8 rounded-soft p-4 shadow-[0_12px_30px_-20px_rgba(42,32,21,0.25)]">
              <h3 className="text-lg font-serif text-espresso mb-1">{s.title}</h3>
              <p className="text-sm text-espresso/70 mb-2">{s.copy}</p>
              <button className="text-sm font-semibold text-primary">Explore →</button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-espresso/8 rounded-soft p-5 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-serif text-espresso mb-2">White-Glove Guarantee</h3>
          <ul className="space-y-1 text-sm text-espresso/80">
            <li>Fixed-Price Security</li>
            <li>Protected Transit</li>
            <li>Apartment & Access Specialists</li>
          </ul>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-serif text-espresso mb-2">Testimonials</h3>
          <p className="text-xl font-serif text-espresso">“The level of care was unlike anything we’ve experienced.”</p>
          <p className="text-sm text-espresso/70 mt-2">— James L., Adelaide</p>
        </div>
      </section>

      <section className="bg-espresso text-white rounded-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary/80">Start</p>
          <h3 className="text-2xl font-serif font-semibold">Start Your Premium Journey</h3>
        </div>
        <Button className="bg-white text-espresso hover:bg-white/90">Book a Private Consultation</Button>
      </section>
    </div>
  );
}
