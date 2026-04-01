import BrandButton from '../../components/brand/BrandButton'

const timeline = [
  { time: '08:00', title: 'Arrival & Site Mapping', note: 'Concierge check-in, access verification' },
  { time: '10:00', title: 'Bespoke Packing', note: 'Fine art and antiquities packed on-site' },
  { time: '14:00', title: 'Precision Loading', note: 'White-glove team, liftgate workflow' },
  { time: '16:00', title: 'Transit Commencement', note: 'Climate-controlled departure' }
]

export default function Itinerary () {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Itinerary</p>
        <h1 className="text-3xl font-serif font-bold text-espresso">Move Itinerary</h1>
        <p className="text-espresso/75">Reference ID: ZQ-77218 · Updated live</p>
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 text-sm text-espresso">
            <div className="font-semibold text-espresso">82 Belgravia Sq, London</div>
            <div className="text-espresso/70">→ Villa L&apos;Estaque, Antibes</div>
            <div className="text-espresso/70">Oct 24, 2024 · The Heritage Suite</div>
            <div className="text-espresso/70">White-Glove Tier · Climate-Controlled Storage</div>
          </div>
          <button className="text-sm font-semibold text-primary">Share</button>
        </div>
        <div className="flex gap-2">
          <BrandButton variant="ghost">Booking Confirmation</BrandButton>
          <BrandButton variant="ghost">Insurance Policy</BrandButton>
        </div>
      </div>

      <div className="space-y-4">
        {timeline.map((item) => (
          <div key={item.title} className="flex gap-3 items-start">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="flex-1 w-px bg-primary/30" />
            </div>
            <div>
              <div className="text-xs font-semibold text-primary">{item.time}</div>
              <div className="text-base font-serif text-espresso">{item.title}</div>
              <div className="text-sm text-espresso/75">{item.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ContactCard name="Eleanor Sterling" role="Concierge" email="eleanor@zqremovals.com" phone="+61 8 0000 0001" />
        <ContactCard name="Julian Vane" role="Crew Lead" email="julian@zqremovals.com" phone="+61 8 0000 0002" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <BrandButton className="flex-1">Update Instructions</BrandButton>
        <BrandButton variant="ghost" className="flex-1">Talk to a Concierge</BrandButton>
      </div>

      <div className="bg-espresso text-white rounded-sm p-4 flex items-center gap-2 text-xs">
        <span className="inline-block w-4 h-4 rounded-full border border-white/40" />
        256-bit secured records
      </div>
    </div>
  )
}

function ContactCard ({ name, role, email, phone }: { name: string, role: string, email: string, phone: string }) {
  return (
    <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
      <div className="h-16 bg-espresso/10 rounded-sm" />
      <div className="text-base font-serif text-espresso">{name}</div>
      <div className="text-sm text-primary font-semibold">{role}</div>
      <div className="flex gap-2">
        <button
          className="text-xs px-2 py-1 border border-espresso/15 rounded-soft text-espresso/80 hover:border-espresso/40 transition"
          aria-label={`Email ${name}`}
          onClick={() => { window.location.href = `mailto:${email}` }}
        >
          Email
        </button>
        <button
          className="text-xs px-2 py-1 border border-espresso/15 rounded-soft text-espresso/80 hover:border-espresso/40 transition"
          aria-label={`Call ${name}`}
          onClick={() => { window.location.href = `tel:${phone}` }}
        >
          Phone
        </button>
      </div>
    </div>
  )
}
