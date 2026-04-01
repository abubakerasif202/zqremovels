import { useState } from 'react'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import BrandButton from '../../components/brand/BrandButton'

const categories = [
  { name: 'Living', count: 18 },
  { name: 'Bedroom', count: 12 },
  { name: 'Kitchen', count: 9 },
  { name: 'Art & Fragile', count: 6 }
]

const specialHandlingOptions = ['White-Glove handling', 'Climate-controlled storage'] as const

export default function BookingStep2 () {
  const [, setLocation] = useLocation()
  const [specialHandling, setSpecialHandling] = useState<Record<string, boolean>>(
    Object.fromEntries(specialHandlingOptions.map(opt => [opt, true]))
  )

  const toggleOption = (label: string) => {
    setSpecialHandling(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleContinue = () => {
    toast.success('Inventory saved')
    setLocation('/booking/step-3')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Step 2 of 3</p>
        <h1 className="text-3xl font-serif font-bold text-espresso">Inventory Selection</h1>
        <p className="text-espresso/75">Outline the items to be moved and any special handling.</p>
      </div>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.name} className="bg-white border border-espresso/8 rounded-soft p-4 flex items-center justify-between">
            <div>
              <div className="text-base font-serif text-espresso">{c.name}</div>
              <div className="text-sm text-espresso/70">Edit items and notes</div>
            </div>
            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-soft">{c.count} items</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-espresso">Special handling</p>
        {specialHandlingOptions.map((label) => (
          <label key={label} className="flex items-center gap-2 text-sm text-espresso/80 cursor-pointer">
            <input
              type="checkbox"
              className="accent-primary"
              checked={specialHandling[label]}
              onChange={() => toggleOption(label)}
              aria-label={label}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-espresso/80">
          <span>Current Estimate</span>
          <span className="font-semibold text-espresso">£5,300.00</span>
        </div>
        <BrandButton className="w-full" onClick={handleContinue}>Continue to Schedule</BrandButton>
        <button className="w-full text-sm text-primary font-semibold hover:opacity-75 transition">Need a hand? Talk to a Concierge</button>
      </div>
    </div>
  )
}
