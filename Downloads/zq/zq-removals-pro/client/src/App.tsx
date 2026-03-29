import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Link, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Brand Pages
import Landing from "./pages/brand/Landing";
import Team from "./pages/brand/Team";
import ServicesFleet from "./pages/brand/ServicesFleet";
import BookingStep1 from "./pages/brand/BookingStep1";
import BookingStep2 from "./pages/brand/BookingStep2";
import BookingStep3 from "./pages/brand/BookingStep3";
import BookingConfirm from "./pages/brand/BookingConfirm";
import BookingConfirmDesktop from "./pages/brand/BookingConfirmDesktop";
import Itinerary from "./pages/brand/Itinerary";
import ItineraryDesktop from "./pages/brand/ItineraryDesktop";

function Header() {
  const [location] = useLocation();
  const navLink = 'text-sm font-medium text-brand-espresso/70 hover:text-brand-espresso transition px-3 py-2';
  const active = 'text-brand-espresso border-b-2 border-brand-primary';

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-brand-ivory/90 border-b border-brand-espresso/5">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/">
          <div className="text-lg font-serif font-semibold tracking-tight text-brand-espresso cursor-pointer">ZQ Removals</div>
        </Link>
        <nav className="hidden md:flex items-center space-x-1">
          <Link href="/"><div className={`${navLink} ${location === "/" ? active : ""}`}>Home</div></Link>
          <Link href="/team"><div className={`${navLink} ${location === "/team" ? active : ""}`}>Team</div></Link>
          <Link href="/services"><div className={`${navLink} ${location === "/services" ? active : ""}`}>Services</div></Link>
          <Link href="/booking/step-1"><div className={`${navLink} ${location.startsWith("/booking") ? active : ""}`}>Booking</div></Link>
          <Link href="/itinerary"><div className={`${navLink} ${location.startsWith("/itinerary") ? active : ""}`}>Itinerary</div></Link>
        </nav>
      </div>
    </header>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-brand-ivory">
      <Header />
      <main className="pb-16">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/pro" component={Home} />
          <Route path="/team" component={Team} />
          <Route path="/services" component={ServicesFleet} />
          <Route path="/booking/step-1" component={BookingStep1} />
          <Route path="/booking/step-2" component={BookingStep2} />
          <Route path="/booking/step-3" component={BookingStep3} />
          <Route path="/booking/confirm" component={BookingConfirm} />
          <Route path="/booking/confirm/desktop" component={BookingConfirmDesktop} />
          <Route path="/itinerary" component={Itinerary} />
          <Route path="/itinerary/desktop" component={ItineraryDesktop} />
          <Route path="/404" component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
