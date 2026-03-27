import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Phone, MapPin } from "lucide-react";
import { useState } from "react";

/**
 * ZQ Removals Home Page
 * Design Philosophy: Premium Professional with Modern Minimalism
 * - Deep navy (#1a2a3a) for authority and trust
 * - Vibrant amber (#fbbf24) for CTAs and highlights
 * - Playfair Display for headlines, Inter for body text
 * - Asymmetric hero, generous whitespace, subtle depth
 */

export default function Home() {
  const [activeService, setActiveService] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">ZQ</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary">ZQ REMOVALS</h1>
              <p className="text-xs text-muted-foreground">Local, interstate, and packing specialists</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-accent transition">Home</a>
            <a href="#local" className="text-sm font-medium text-foreground hover:text-accent transition">Local Removals</a>
            <a href="#interstate" className="text-sm font-medium text-foreground hover:text-accent transition">Interstate Removals</a>
            <a href="#packing" className="text-sm font-medium text-foreground hover:text-accent transition">Packing Services</a>
            <a href="#guides" className="text-sm font-medium text-foreground hover:text-accent transition">Moving Guides</a>
            <a href="#contact" className="text-sm font-medium text-foreground hover:text-accent transition">Contact Us</a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <a href="tel:0433819989" className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition">
              <Phone className="w-4 h-4" />
              0433 819 989
            </a>
            <Button className="bg-accent hover:bg-amber-400 text-primary font-semibold">
              Fixed-Price Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/90 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="text-xs font-semibold text-accent tracking-widest">PREMIUM ADELAIDE MOVING COMPANY</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Adelaide moves scoped before the truck arrives.
              </h1>
              <p className="text-lg text-gray-200 leading-relaxed max-w-lg">
                ZQ Removals reviews access, inventory, timing, and protection requirements before move day so local, interstate, office, and packing-heavy jobs run with fewer assumptions.
              </p>

              {/* Key Points */}
              <div className="space-y-3 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Fixed-price quote scopes</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Apartment, dock, and parking reviews</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Local and interstate route coordination</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button className="bg-accent hover:bg-amber-400 text-primary font-semibold px-8 py-6 text-base">
                  Get a Fixed-Price Quote
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-base">
                  <Phone className="w-4 h-4 mr-2" />
                  Call 0433 819 989
                </Button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-96 md:h-screen md:min-h-96 flex items-center justify-center">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663482639234/5pakVRW8B9FGiBQqsrb7QC/hero-moving-truck-KsoW7CazkJggtEDNRABzmc.webp"
                alt="ZQ Removals truck - Professional moving services"
                className="w-full h-full object-cover rounded-2xl shadow-2xl hover:shadow-3xl transition-shadow duration-300"
              />
              <div className="absolute bottom-6 left-6 bg-primary/95 backdrop-blur-md px-6 py-3 rounded-xl shadow-lg border border-accent/30">
                <span className="text-xs font-semibold text-accent tracking-wider">ADELAIDE BASED</span>
              </div>
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-6 py-3 rounded-xl shadow-lg">
                <span className="text-xs font-bold text-primary">TRUSTED REMOVALISTS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guesswork Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663482639234/5pakVRW8B9FGiBQqsrb7QC/service-local-removals-M7cpTYoyBowFNBxTtGyxCX.webp"
                alt="Less guesswork on moving day"
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-primary">Less guesswork on moving day.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Route timing, packing scope, and property access are checked upfront so the move plan is clearer before loading starts.
              </p>
              <div className="bg-muted p-6 rounded-lg border border-border">
                <p className="text-sm font-semibold text-primary mb-2">ZQ Removals</p>
                <p className="text-sm text-foreground">Adelaide local, interstate, office, and packing support from Andrews Farm.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section id="services" className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Three ways to start the right move plan.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with the page that matches the move. Each service hub breaks down the details that change pricing, timing, and handling.
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Local Removals */}
            <div
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
              onMouseEnter={() => setActiveService("local")}
              onMouseLeave={() => setActiveService(null)}
            >
              <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663482639234/5pakVRW8B9FGiBQqsrb7QC/service-local-removals-realistic-heRRf3aFvUEmwck9tCans9.webp"
                  alt="Local Removals - Professional movers loading furniture"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-primary">Local Removals</h3>
                <p className="text-sm text-muted-foreground">
                  Adelaide home and apartment moves scoped around parking, stairs, lifts, laneways, and tight residential access.
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Suburb pages for Adelaide CBD, Marion, Salisbury, Elizabeth, and Glenelg</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Lift bookings, parking permits, and loading access reviewed early</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Useful for homes, apartments, and office relocations inside Adelaide</span>
                  </li>
                </ul>
                <a href="#" className="inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all">
                  Explore local removals <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Interstate Removals */}
            <div
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
              onMouseEnter={() => setActiveService("interstate")}
              onMouseLeave={() => setActiveService(null)}
            >
              <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663482639234/5pakVRW8B9FGiBQqsrb7QC/service-interstate-realistic-VRWs6B5MUEetivFeyECwCU.webp"
                  alt="Interstate Removals - Moving truck on highway"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-primary">Interstate Removals</h3>
                <p className="text-sm text-muted-foreground">
                  Longer-distance moves planned around route timing, fixed-price scopes, and cleaner handling between Adelaide and the east coast.
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Dedicated Adelaide to Melbourne and Adelaide to Sydney routes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Route-specific ETAs, delivery windows, and customer prep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Reduced double-handling for time-sensitive or higher-care loads</span>
                  </li>
                </ul>
                <a href="#" className="inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all">
                  View interstate routes <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Packing Services */}
            <div
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
              onMouseEnter={() => setActiveService("packing")}
              onMouseLeave={() => setActiveService(null)}
            >
              <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663482639234/5pakVRW8B9FGiBQqsrb7QC/service-packing-realistic-cV4w246jFR4K5LzJpG7mQ3.webp"
                  alt="Packing Services - Professional bubble wrap and fragile items"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-primary">Packing Services</h3>
                <p className="text-sm text-muted-foreground">
                  Packing, wrapping, and furniture protection that reduces loading delays and lowers transport risk for fragile items.
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Fragile wrapping, carton supply, and furniture protection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Kitchen, wardrobe, office, and partial-pack options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">•</span>
                    <span>Useful when timing is tight or the inventory needs more care</span>
                  </li>
                </ul>
                <a href="#" className="inline-flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all">
                  See packing services <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Workflow Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Better move plans start with clearer quote inputs.</h2>
              <p className="text-lg text-muted-foreground">
                The intake flow focuses on the details that materially affect labour, vehicle size, loading order, and schedule reliability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent">1</span>
                </div>
                <h3 className="font-semibold text-primary">Local and interstate ready</h3>
                <p className="text-sm text-muted-foreground">Capture pickup and drop-off suburbs before pricing assumptions are made.</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent">2</span>
                </div>
                <h3 className="font-semibold text-primary">Mobile-first quote flow</h3>
                <p className="text-sm text-muted-foreground">Collect service type, move size, and preferred date in one pass.</p>
              </div>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="font-semibold text-primary">Room for special access notes</h3>
                <p className="text-sm text-muted-foreground">Leave room for stairs, loading docks, booked lifts, and fragile inventory.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Paths Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">Start with the route, service, or planning page that matches the job.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use the service hubs when the move brief is already clear. Use the guides when you still need help with pricing, checklists, or preparation before requesting a fixed-price quote.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Adelaide Hub */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Adelaide hub</h3>
                  <p className="text-muted-foreground">Local removals across Adelaide</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Start here for suburb moves, apartments, and local routes that need access, parking, or loading review.
              </p>
              <Button className="w-full bg-accent hover:bg-amber-400 text-primary font-semibold">
                Open local removals hub
              </Button>
            </div>

            {/* Interstate Hub */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Interstate hub</h3>
                  <p className="text-muted-foreground">Melbourne, Sydney, and custom routes</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Use the interstate hub when the move leaves South Australia and timing, destination access, or handover windows matter.
              </p>
              <Button className="w-full bg-accent hover:bg-amber-400 text-primary font-semibold">
                Open interstate hub
              </Button>
            </div>

            {/* Commercial Moves */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Commercial moves</h3>
                  <p className="text-muted-foreground">Office relocations and business resets</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                For after-hours moves, workstation handling, and commercial downtime planning across Adelaide.
              </p>
              <Button className="w-full bg-accent hover:bg-amber-400 text-primary font-semibold">
                Open office removals
              </Button>
            </div>

            {/* Planning Resources */}
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">Planning resources</h3>
                  <p className="text-muted-foreground">Moving guides before you request pricing</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-6">
                Read the cost, packing, interstate, and office planning guides if you need the brief clearer before the quote.
              </p>
              <Button className="w-full bg-accent hover:bg-amber-400 text-primary font-semibold">
                Browse moving guides
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="contact" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-12 text-center">What most Adelaide clients ask before requesting pricing.</h2>

            <div className="space-y-8">
              <div className="border-b border-border pb-8">
                <h3 className="text-xl font-semibold text-primary mb-4">What information helps a fixed-price quote stay accurate?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  The pickup and delivery suburbs, preferred date, property access, inventory size, parking limits, and any fragile or oversized items are the details that matter most.
                </p>
              </div>

              <div className="border-b border-border pb-8">
                <h3 className="text-xl font-semibold text-primary mb-4">Do you handle both local and interstate moves?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Yes. ZQ Removals handles Adelaide local moves, interstate routes, office relocations, and packing support, with the scope reviewed differently depending on the job type.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">When should I use the moving guides instead of the quote form?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Use the guides when you still need help with pricing, preparation, checklists, or route planning. Use the quote form when you already know the route and want the move scoped.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-accent transition">Home</a></li>
                <li><a href="#" className="hover:text-accent transition">Local Removals</a></li>
                <li><a href="#" className="hover:text-accent transition">Interstate Removals</a></li>
                <li><a href="#" className="hover:text-accent transition">Packing Services</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-accent transition">Office Removals</a></li>
                <li><a href="#" className="hover:text-accent transition">Furniture Removalists</a></li>
                <li><a href="#" className="hover:text-accent transition">Moving Guides</a></li>
                <li><a href="#" className="hover:text-accent transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Popular Suburbs</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-accent transition">Adelaide CBD</a></li>
                <li><a href="#" className="hover:text-accent transition">Marion</a></li>
                <li><a href="#" className="hover:text-accent transition">Salisbury</a></li>
                <li><a href="#" className="hover:text-accent transition">Elizabeth</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm text-gray-300 mb-4">
                <a href="tel:0433819989" className="hover:text-accent transition">0433 819 989</a>
              </p>
              <p className="text-xs text-gray-400">
                Adelaide local, interstate, office, and packing support from Andrews Farm.
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
              <p>&copy; 2026 ZQ Removals. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-accent transition">Privacy Policy</a>
                <a href="#" className="hover:text-accent transition">Terms & Conditions</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
