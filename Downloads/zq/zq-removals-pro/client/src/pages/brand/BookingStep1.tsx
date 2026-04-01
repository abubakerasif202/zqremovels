import { useState } from 'react'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import BrandButton from '../../components/brand/BrandButton'

interface FormData {
  moveFrom: string
  moveTo: string
  date: string
  propertyType: string
  accessNotes: string
}

interface FormErrors {
  moveFrom?: string
  moveTo?: string
  date?: string
  propertyType?: string
}

export default function BookingStep1 () {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState<FormData>({
    moveFrom: '',
    moveTo: '',
    date: '',
    propertyType: '',
    accessNotes: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!formData.moveFrom.trim()) errs.moveFrom = 'Move From is required'
    if (!formData.moveTo.trim()) errs.moveTo = 'Move To is required'
    if (!formData.date.trim()) errs.date = 'Date is required'
    if (!formData.propertyType.trim()) errs.propertyType = 'Property Type is required'
    return errs
  }

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleContinue = () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('Please fill in all required fields')
      return
    }
    setLocation('/booking/step-2')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs tracking-[0.2em] uppercase text-espresso/60">Step 1 of 3</p>
        <h1 className="text-3xl font-serif font-bold text-espresso">Start Your Move</h1>
        <p className="text-espresso/75">Concierge details to begin your tailored plan.</p>
      </div>

      <div className="space-y-5">
        <Field
          label="Move From"
          placeholder="82 Belgravia Sq, London"
          value={formData.moveFrom}
          onChange={handleChange('moveFrom')}
          error={errors.moveFrom}
        />
        <Field
          label="Move To"
          placeholder="Villa L'Estaque, Antibes"
          value={formData.moveTo}
          onChange={handleChange('moveTo')}
          error={errors.moveTo}
        />
        <Field
          label="Date"
          placeholder="24 Oct 2024"
          value={formData.date}
          onChange={handleChange('date')}
          error={errors.date}
        />
        <Field
          label="Property Type"
          placeholder="The Heritage Suite"
          value={formData.propertyType}
          onChange={handleChange('propertyType')}
          error={errors.propertyType}
        />
        <Field
          label="Access Notes"
          placeholder="Service lift booking, heritage access window"
          value={formData.accessNotes}
          onChange={handleChange('accessNotes')}
          isTextArea
        />
      </div>

      <div className="bg-white border border-espresso/8 rounded-soft p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-espresso/80">
          <span>Estimated Investment</span>
          <span className="font-semibold text-espresso">£5,300.00</span>
        </div>
        <BrandButton className="w-full" onClick={handleContinue}>Continue to Inventory</BrandButton>
        <button className="w-full text-sm text-primary font-semibold hover:opacity-75 transition">Talk to a Concierge</button>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  placeholder: string
  isTextArea?: boolean
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
}

function Field ({ label, placeholder, isTextArea, value, onChange, error }: FieldProps) {
  return (
    <div className="block space-y-1">
      <label className="text-sm font-semibold text-espresso">{label}</label>
      {isTextArea === true
        ? (
        <textarea
          className={`w-full bg-transparent border-b focus:border-primary outline-none pb-2 text-sm ${error ? 'border-red-400' : 'border-espresso/20'}`}
          placeholder={placeholder}
          rows={3}
          value={value}
          onChange={onChange}
          aria-label={label}
        />
          )
        : (
        <input
          className={`w-full bg-transparent border-b focus:border-primary outline-none pb-2 text-sm ${error ? 'border-red-400' : 'border-espresso/20'}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-label={label}
        />
          )}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
