import BrandButton from '../../components/brand/BrandButton'

const events = [
  { time: '08:00', title: 'Arrival & Site Mapping', note: 'Concierge check-in, access verification', location: 'Belgravia Sq' },
  { time: '10:00', title: 'Bespoke Packing', note: 'Fine art and antiquities packed on-site', location: 'Main Gallery' },
  { time: '14:00', title: 'Precision Loading', note: 'White-glove team, liftgate workflow', location: 'Service Bay' },
  { time: '16:00', title: 'Transit Commencement', note: 'Climate-controlled departure', location: 'Outbound Route' }
]

export default function ItineraryDesktop () {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Itinerary</p>
          <h1 className="text-4xl font-serif font-bold text-espresso">Your Concierge Move</h1>
          <p className="text-sm text-espresso/70">Reference ID: ZQ-77218 · Live status</p>
        </div>
        <div className="flex gap-3">
          <BrandButton variant="ghost">Share</BrandButton>
          <BrandButton>Download PDF</BrandButton>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2 shadow-[0_20px_50px_-35px_rgba(42,32,21,0.35)]">
          <div className="text-sm font-semibold text-espresso">Move Summary</div>
          <p className="text-sm text-espresso">123 Park Avenue, New York, NY → 456 Ocean Drive, Miami, FL</p>
          <p className="text-sm text-espresso/75">Date: Oct 28, 2024 · Property: Private Estate</p>
          <p className="text-sm text-espresso/75">Tier: White-Glove · Climate-Controlled Storage</p>
          <div className="flex gap-2 pt-2">
            <BrandButton variant="ghost">Booking Confirmation</BrandButton>
            <BrandButton variant="ghost">Insurance Policy</BrandButton>
          </div>
        </div>
        <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
          <div className="text-sm font-semibold text-espresso">Contacts</div>
          <div className="grid grid-cols-2 gap-3 text-sm text-espresso/80">
            <Contact name="Eleanor Sterling" role="Concierge" email="eleanor@zqremovals.com" phone="+61 8 0000 0001" />
            <Contact name="Julian Vane" role="Crew Lead" email="julian@zqremovals.com" phone="+61 8 0000 0002" />
          </div>
          <div className="pt-3 text-sm">
            <div className="flex justify-between text-espresso/75"><span>Estimated Investment</span><span className="font-semibold text-espresso">£5,300.00</span></div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-espresso/8 rounded-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-serif text-espresso">Schedule</div>
          <div className="text-xs text-espresso/60">All times local</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {events.map((e) => (
            <div key={e.title} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="flex-1 w-px bg-primary/30" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-primary">{e.time}</div>
                <div className="text-base font-serif text-espresso">{e.title}</div>
                <div className="text-sm text-espresso/75">{e.note}</div>
                <div className="text-xs text-espresso/60">{e.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col md:flex-row gap-3">
        <BrandButton className="flex-1">Update Instructions</BrandButton>
        <BrandButton variant="ghost" className="flex-1">Talk to a Concierge</BrandButton>
      </section>

      <footer className="bg-espresso text-white rounded-sm p-4 flex items-center gap-2 text-xs">
        <span className="inline-block w-4 h-4 rounded-full border border-white/40" />
        256-bit secured records
      </footer>
    </div>
  )
}

function Contact ({ name, role, email, phone }: { name: string, role: string, email: string, phone: string }) {
  return (
    <div className="space-y-1">
      <div className="text-espresso font-semibold">{name}</div>
      <div className="text-espresso/70 text-xs">{role}</div>
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
