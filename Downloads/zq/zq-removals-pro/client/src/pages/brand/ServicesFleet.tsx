import BrandButton from '../../components/brand/BrandButton'

const services = [
  'Local Moves',
  'Interstate Logistics',
  'International Coordination',
  'White-Glove Packing',
  'Art & Heritage Handling',
  'Secure Storage'
]

const fleet = [
  { name: 'Sprinter Class', specs: ['14m³ Capacity', 'Climate Ready', 'Liftgate N/A'] },
  { name: '5T Heritage Truck', specs: ['30m³ Capacity', 'Air-Ride', 'Power Liftgate'] },
  { name: 'Climate-Controlled Van', specs: ['18m³ Capacity', 'Climate 18–24°C', 'Low-Vibration'] }
]

export default function ServicesFleet () {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-14">
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-espresso">Our Fleet & Services</h1>
          <p className="text-espresso/80 max-w-xl">Concierge logistics with tailored equipment, climate-aware routing, and discreet white-glove crews.</p>
          <div className="flex gap-3">
            <BrandButton>Request a Concierge Plan</BrandButton>
            <BrandButton variant="ghost">Talk to a Concierge</BrandButton>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-6 -right-8 -bottom-6 -left-10 bg-espresso/90 rounded-sm" />
          <div className="relative h-72 bg-gradient-to-br from-espresso/80 to-espresso/60 rounded-sm" />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc) => (
          <div key={svc} className="bg-white border border-espresso/8 rounded-soft p-4 shadow-[0_16px_36px_-24px_rgba(42,32,21,0.25)] space-y-2">
            <div className="h-28 bg-espresso/10 rounded-sm" />
            <h3 className="text-lg font-serif text-espresso">{svc}</h3>
            <p className="text-sm text-espresso/70">Polished two-line copy describing this premium service offering.</p>
            <button className="text-sm font-semibold text-primary">Explore →</button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-2xl font-serif text-espresso">Fleet Showcase</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {fleet.map((f) => (
            <div key={f.name} className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
              <div className="h-24 bg-espresso/10 rounded-sm" />
              <div className="text-lg font-serif text-espresso">{f.name}</div>
              <div className="flex flex-wrap gap-2">
                {f.specs.map((spec) => (
                  <span key={spec} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-soft">{spec}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4 bg-white border border-espresso/8 rounded-soft p-5">
        {['Plan', 'Protect', 'Deliver'].map((step) => (
          <div key={step} className="space-y-1">
            <div className="w-10 h-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-semibold">{step[0]}</div>
            <div className="text-base font-serif text-espresso">{step}</div>
            <p className="text-sm text-espresso/75">Concise guidance for clients on the journey.</p>
          </div>
        ))}
      </section>

      <section className="bg-espresso text-white rounded-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary/80">Trusted by</p>
          <h3 className="text-2xl font-serif font-semibold">Private Residences · Galleries · Executive Offices · Embassy Moves</h3>
        </div>
        <BrandButton className="bg-white text-espresso hover:bg-white/90">Book a Private Consultation</BrandButton>
      </section>
    </div>
  )
}
