import BrandButton from '../../components/brand/BrandButton'

const people = [
  { name: 'Eleanor Sterling', role: 'Move Strategist', bio: 'Architects every relocation as a bespoke plan.' },
  { name: 'Julian Vane', role: 'Logistics Lead', bio: 'Orchestrates multi-city routes with minute-level precision.' },
  { name: 'Saffron Thorne', role: 'White-Glove Specialist', bio: 'Leads fine art, antiques, and couture handling.' },
  { name: 'Marin Caro', role: 'Preservation Lead', bio: 'Supervises packing chemistry and climate controls.' },
  { name: 'Rowan Hale', role: 'Access Specialist', bio: 'Navigates heritage sites and tight urban access.' },
  { name: 'Ines Laurent', role: 'Client Concierge', bio: 'Single point of contact from brief to handover.' }
]

export default function Team (): JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-12">
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-bold text-espresso">Meet Your Concierge Team</h1>
          <p className="text-espresso/80 max-w-xl">Dedicated move strategists providing an unparalleled level of care, treating each transition as an architectural event.</p>
          <div className="flex gap-3">
            <BrandButton>Book a Private Consultation</BrandButton>
            <BrandButton variant="ghost">Talk to a Concierge</BrandButton>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-6 -right-6 -bottom-6 -left-10 bg-espresso/90 rounded-sm" />
          <div className="relative h-72 bg-gradient-to-br from-espresso/80 to-espresso/60 rounded-sm" />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map((p) => (
          <div key={p.name} className="bg-white border border-espresso/8 rounded-soft p-4 shadow-[0_16px_36px_-24px_rgba(42,32,21,0.25)] space-y-2">
            <div className="h-32 bg-espresso/10 rounded-sm" />
            <div className="text-lg font-serif text-espresso">{p.name}</div>
            <div className="text-sm font-semibold text-primary">{p.role}</div>
            <p className="text-sm text-espresso/75">{p.bio}</p>
            <div className="flex gap-2 pt-2">
              <span className="text-xs px-2 py-1 border border-espresso/15 rounded-soft text-espresso/80">Email</span>
              <span className="text-xs px-2 py-1 border border-espresso/15 rounded-soft text-espresso/80">Phone</span>
            </div>
          </div>
        ))}
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
          <h3 className="text-2xl font-serif font-semibold">Private Residences, Galleries, Executive Offices, Embassy Moves</h3>
        </div>
        <Button className="bg-white text-espresso hover:bg-white/90">Book a Private Consultation</Button>
      </section>
    </div>
  )
}
