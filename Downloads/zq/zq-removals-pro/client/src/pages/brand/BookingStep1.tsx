import BrandButton from '../../components/brand/BrandButton'

export default function BookingStep1 (): JSX.Element {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Step 1 of 3</p>
        <h1 className="text-3xl font-serif font-bold text-espresso">Start Your Move</h1>
        <p className="text-espresso/75">Concierge details to begin your tailored plan.</p>
      </div>

      <div className="space-y-5">
        <Field label="Move From" placeholder="82 Belgravia Sq, London" />
        <Field label="Move To" placeholder="Villa L'Estaque, Antibes" />
        <Field label="Date" placeholder="24 Oct 2024" />
        <Field label="Property Type" placeholder="The Heritage Suite" />
        <Field label="Access Notes" placeholder="Service lift booking, heritage access window" isTextArea />
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-espresso/80">
          <span>Estimated Investment</span>
          <span className="font-semibold text-espresso">£5,300.00</span>
        </div>
        <BrandButton className="w-full">Continue to Inventory</BrandButton>
        <button className="w-full text-sm text-primary font-semibold">Talk to a Concierge</button>
      </div>
    </div>
  )
}

function Field ({ label, placeholder, isTextArea }: { label: string, placeholder: string, isTextArea?: boolean }): JSX.Element {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-espresso">{label}</span>
      {isTextArea === true
        ? (
        <textarea className="w-full bg-transparent border-b border-espresso/20 focus:border-primary outline-none pb-2 text-sm" placeholder={placeholder} rows={3} />
          )
        : (
        <input className="w-full bg-transparent border-b border-espresso/20 focus:border-primary outline-none pb-2 text-sm" placeholder={placeholder} />
          )}
    </label>
  )
}
