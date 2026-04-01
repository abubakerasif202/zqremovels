import { useState } from 'react'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import BrandButton from '../../components/brand/BrandButton'

export default function BookingStep3 () {
  const [, setLocation] = useLocation()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [billingSameAsOrigin, setBillingSameAsOrigin] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the terms of service to continue')
      return
    }
    setIsSubmitting(true)
    try {
      // Simulate booking confirmation
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Booking confirmed!')
      setLocation('/booking/confirm')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Step 3 of 3</p>
        <h1 className="text-3xl font-serif font-bold text-espresso">Review & Payment</h1>
        <p className="text-espresso/75">Confirm details and complete payment securely.</p>
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-espresso">Move Summary</div>
            <p className="text-sm text-espresso/70">82 Belgravia Sq → Villa L&apos;Estaque · 24 Oct 2024</p>
            <p className="text-sm text-espresso/70">The Heritage Suite · White-Glove, Climate Storage</p>
          </div>
          <button
            className="text-sm text-primary font-semibold hover:opacity-75 transition"
            onClick={() => setLocation('/booking/step-1')}
          >
            Edit
          </button>
        </div>
        <div className="border-t border-espresso/10 pt-2 text-sm text-espresso/80">
          <div className="flex justify-between"><span>Base relocation</span><span>£4,850.00</span></div>
          <div className="flex justify-between"><span>Storage</span><span>£450.00</span></div>
          <div className="flex justify-between font-semibold text-espresso"><span>Total</span><span>£5,300.00</span></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-soft p-3 text-xs text-amber-800">
          Payment is processed securely via our payment provider. Card details are never stored on our servers.
        </div>
        <Field label="Name on Card" placeholder="Your full name" autoComplete="cc-name" />
        <Field label="Card Number" placeholder="•••• •••• •••• ••••" autoComplete="cc-number" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" placeholder="MM/YY" autoComplete="cc-exp" />
          <Field label="CVC" placeholder="•••" autoComplete="cc-csc" />
        </div>
        <label className="flex items-center gap-2 text-sm text-espresso/80 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary"
            checked={billingSameAsOrigin}
            onChange={e => setBillingSameAsOrigin(e.target.checked)}
            aria-label="Billing same as move origin"
          />
          Billing same as move origin
        </label>
        <label className="flex items-center gap-2 text-sm text-espresso/80 cursor-pointer">
          <input
            type="checkbox"
            className="accent-primary"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            aria-label="I agree to the terms of service"
          />
          I agree to the terms of service
        </label>
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <BrandButton
          className="w-full"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing…' : 'Confirm & Pay'}
        </BrandButton>
        <button className="w-full text-sm text-primary font-semibold hover:opacity-75 transition">Talk to a Concierge</button>
        <div className="flex items-center gap-2 text-xs text-espresso/70 pt-2">
          <span className="inline-block w-4 h-4 rounded-full border border-espresso/40" aria-hidden="true" />
          256-bit secured payment
        </div>
      </div>
    </div>
  )
}

function Field ({ label, placeholder, autoComplete }: { label: string, placeholder: string, autoComplete?: string }) {
  return (
    <div className="block space-y-1">
      <label className="text-sm font-semibold text-espresso">{label}</label>
      <input
        className="w-full bg-transparent border-b border-espresso/20 focus:border-primary outline-none pb-2 text-sm"
        placeholder={placeholder}
        aria-label={label}
        autoComplete={autoComplete}
      />
    </div>
  )
}
