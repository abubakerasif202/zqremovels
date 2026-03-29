import React from 'react';
import Button from '../components/Button';

export default function BookingStep3() {
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
          <button className="text-sm text-primary font-semibold">Edit</button>
        </div>
        <div className="border-t border-espresso/10 pt-2 text-sm text-espresso/80">
          <div className="flex justify-between"><span>Base relocation</span><span>£4,850.00</span></div>
          <div className="flex justify-between"><span>Storage</span><span>£450.00</span></div>
          <div className="flex justify-between font-semibold text-espresso"><span>Total</span><span>£5,300.00</span></div>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Name on Card" placeholder="Eleanor Sterling" required />
        <Field label="Card Number" placeholder="4242 4242 4242 4242" type="text" inputMode="numeric" pattern="[\d ]{13,19}" maxLength={19} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" placeholder="10/27" type="text" inputMode="numeric" pattern="\d{2}/\d{2}" maxLength={5} required />
          <Field label="CVC" placeholder="123" type="text" inputMode="numeric" pattern="\d{3,4}" maxLength={4} required />
        </div>
        <label className="flex items-center gap-2 text-sm text-espresso/80">
          <input type="checkbox" className="accent-primary" defaultChecked /> Billing same as move origin
        </label>
        <label className="flex items-center gap-2 text-sm text-espresso/80">
          <input type="checkbox" className="accent-primary" /> I agree to the terms of service
        </label>
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <Button className="w-full">Confirm & Pay</Button>
        <button className="w-full text-sm text-primary font-semibold">Talk to a Concierge</button>
        <div className="flex items-center gap-2 text-xs text-espresso/70 pt-2">
          <span className="inline-block w-4 h-4 rounded-full border border-espresso/40" />
          256-bit secured payment
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", inputMode, pattern, maxLength, required }: { label: string; placeholder: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; pattern?: string; maxLength?: number; required?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-espresso">{label}</span>
      <input
        className="w-full bg-transparent border-b border-espresso/20 focus:border-primary outline-none pb-2 text-sm"
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
