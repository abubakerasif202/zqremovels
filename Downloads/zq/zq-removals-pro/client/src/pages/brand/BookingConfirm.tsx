import BrandButton from '../../components/brand/BrandButton'

export default function BookingConfirm () {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary font-semibold">✓</div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-espresso">Your concierge move is confirmed</h1>
          <p className="text-sm text-espresso/70">Reference ID: ZQ-77218. A confirmation email has been sent.</p>
        </div>
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex justify-between text-sm text-espresso/80">
          <span>Move</span>
          <button className="text-primary font-semibold">View itinerary</button>
        </div>
        <p className="text-sm text-espresso">82 Belgravia Sq, London → Villa L&apos;Estaque, Antibes</p>
        <p className="text-sm text-espresso/75">Date: Oct 24, 2024 · Property: The Heritage Suite</p>
        <p className="text-sm text-espresso/75">Services: White-Glove Tier, Climate-Controlled Storage</p>
        <div className="flex justify-between text-sm font-semibold text-espresso pt-2 border-t border-espresso/10">
          <span>Total</span>
          <span>£5,300.00</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <BrandButton className="flex-1">Download Confirmation</BrandButton>
        <BrandButton variant="ghost" className="flex-1">Talk to a Concierge</BrandButton>
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
