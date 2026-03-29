import BrandButton from '../../components/brand/BrandButton'

export default function BookingConfirmDesktop (): JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center text-primary font-semibold text-xl">✓</div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-espresso">Your concierge move is confirmed</h1>
          <p className="text-sm text-espresso/70">Reference ID: ZQ-77218. A confirmation email has been sent.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white border border-espresso/8 rounded-soft p-5 space-y-3 shadow-[0_20px_50px_-35px_rgba(42,32,21,0.35)]">
          <div className="flex justify-between text-sm text-espresso/80">
            <span className="font-semibold text-espresso">Move Summary</span>
            <div className="flex gap-3">
              <button className="text-primary font-semibold">Edit details</button>
              <button className="text-primary font-semibold">View itinerary</button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-espresso/80">
            <Info label="Origin" value="123 Park Avenue, New York, NY 10017" />
            <Info label="Destination" value="456 Ocean Drive, Miami, FL 33139" />
            <Info label="Date" value="October 28, 2024" />
            <Info label="Property" value="Private Estate" />
            <Info label="Services" value="White-Glove Tier, Climate-Controlled Storage" />
            <Info label="Investment" value="£5,300.00" />
          </div>
          <div className="border-t border-espresso/10 pt-3 text-sm text-espresso/80 space-y-1">
            <Row label="Base Relocation" value="£4,850.00" />
            <Row label="Storage" value="£450.00" />
            <Row label="Insurance" value="Included" />
            <Row label="Total" value="£5,300.00" highlight />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
            <BrandButton className="w-full">Download Confirmation</BrandButton>
            <BrandButton variant="ghost" className="w-full">Talk to a Concierge</BrandButton>
            <div className="flex items-center gap-2 text-xs text-espresso/70 pt-2">
              <span className="inline-block w-4 h-4 rounded-full border border-espresso/40" />
              256-bit secured records
            </div>
          </div>
          <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
            <div className="text-sm font-semibold text-espresso">Documents</div>
            <button className="text-sm text-primary font-semibold">Download confirmation (PDF)</button>
            <button className="text-sm text-primary font-semibold">Insurance certificate (PDF)</button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 bg-white border border-espresso/8 rounded-soft p-5">
        {['Pre-move call', 'Inventory finalization', 'Access coordination'].map((item) => (
          <div key={item} className="space-y-1">
            <div className="w-10 h-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center font-semibold">{item[0]}</div>
            <div className="text-base font-serif text-espresso">{item}</div>
            <p className="text-sm text-espresso/75">Concise note on what to expect.</p>
          </div>
        ))}
      </div>

      <div className="bg-espresso text-white rounded-sm p-4 flex items-center gap-2 text-xs">
        <span className="inline-block w-4 h-4 rounded-full border border-white/40" />
        256-bit secured records
      </div>
    </div>
  )
}

function Info ({ label, value }: { label: string, value: string }): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-espresso/60">{label}</div>
      <div className="text-espresso">{value}</div>
    </div>
  )
}

function Row ({ label, value, highlight }: { label: string, value: string, highlight?: boolean }): JSX.Element {
  return (
    <div className="flex justify-between">
      <span className="text-espresso/75">{label}</span>
      <span className={highlight === true ? 'text-primary font-semibold' : 'text-espresso/75'}>{value}</span>
    </div>
  )
}
