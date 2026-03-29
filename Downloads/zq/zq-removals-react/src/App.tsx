import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/home/Hero';
import { TrustBar } from './components/home/TrustBar';
import { Services } from './components/home/Services';
import { WhyChooseUs } from './components/home/WhyChooseUs';
import { Testimonials } from './components/home/Testimonials';
import { QuoteForm } from './components/home/QuoteForm';
import { AnimatedBackground } from './components/ui/AnimatedBackground';

function App() {
  return (
    <div className="min-h-screen relative font-sans selection:bg-white/30">
      <AnimatedBackground />
      <Navbar />
      
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <WhyChooseUs />
        <Testimonials />
        <QuoteForm />
      </main>

      <Footer />
    </div>
  );
}

export default App;