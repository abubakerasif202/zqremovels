import { Route, Routes, NavLink } from 'react-router-dom'
import Landing from './pages/Landing'
import Team from './pages/Team'
import ServicesFleet from './pages/ServicesFleet'
import BookingStep1 from './pages/BookingStep1'
import BookingStep2 from './pages/BookingStep2'
import BookingStep3 from './pages/BookingStep3'
import BookingConfirm from './pages/BookingConfirm'
import BookingConfirmDesktop from './pages/BookingConfirmDesktop'
import Itinerary from './pages/Itinerary'
import ItineraryDesktop from './pages/ItineraryDesktop'

const navLink = 'text-sm font-medium text-espresso/70 hover:text-espresso transition px-3 py-2'
const active = 'text-espresso border-b-2 border-primary'

export default function App (): JSX.Element {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="sticky top-0 z-20 backdrop-blur bg-ivory/90 border-b border-espresso/5">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="text-lg font-serif font-semibold tracking-tight text-espresso">ZQ Removals</div>
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink to="/" className={({ isActive }) => `${navLink} ${isActive ? active : ''}`}>Home</NavLink>
            <NavLink to="/team" className={({ isActive }) => `${navLink} ${isActive ? active : ''}`}>Team</NavLink>
            <NavLink to="/services" className={({ isActive }) => `${navLink} ${isActive ? active : ''}`}>Services</NavLink>
            <NavLink to="/booking/step-1" className={({ isActive }) => `${navLink} ${isActive ? active : ''}`}>Booking</NavLink>
            <NavLink to="/itinerary" className={({ isActive }) => `${navLink} ${isActive ? active : ''}`}>Itinerary</NavLink>
          </nav>
        </div>
      </header>

      <main className="pb-16">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/team" element={<Team />} />
          <Route path="/services" element={<ServicesFleet />} />
          <Route path="/booking/step-1" element={<BookingStep1 />} />
          <Route path="/booking/step-2" element={<BookingStep2 />} />
          <Route path="/booking/step-3" element={<BookingStep3 />} />
          <Route path="/booking/confirm" element={<BookingConfirm />} />
          <Route path="/booking/confirm/desktop" element={<BookingConfirmDesktop />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/itinerary/desktop" element={<ItineraryDesktop />} />
        </Routes>
      </main>
    </div>
  )
}
