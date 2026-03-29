import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="pt-20 pb-10 border-t border-white/10 bg-black/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-20">
          <div className="col-span-2">
            <span className="text-3xl font-bold tracking-tighter text-white mb-6 block">
              ZQ<span className="text-zinc-500">.</span>
            </span>
            <p className="text-zinc-400 max-w-sm mb-8">
              Elevating the standard of relocation across Australia. Premium service, absolute reliability.
            </p>
            <a href="mailto:zqremovals.au@gmail.com" className="inline-flex items-center gap-2 text-white hover:text-zinc-300 transition-colors">
              zqremovals.au@gmail.com <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6">Services</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">Local Moves</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Interstate</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Corporate</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Packing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Company</h4>
            <ul className="space-y-4 text-zinc-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} ZQ Removals. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}