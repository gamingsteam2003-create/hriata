import { Link } from "react-router-dom";
import { FileCheck2 } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-navy-deep text-slate-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-white" />
              </span>
              <span className="font-heading font-semibold text-lg text-white">FormEase</span>
            </div>
            <p className="text-sm text-slate-400 mb-2 font-medium">Your Forms. Simplified.</p>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Professional assistance with Scholarship, PAN Card and Learner's Licence
              applications — through one simple and secure platform.
            </p>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" data-testid="footer-link-home" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/#services" data-testid="footer-link-services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/track" data-testid="footer-link-track" className="hover:text-white transition-colors">Track Application</Link></li>
              <li><Link to="/#contact" data-testid="footer-link-contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" data-testid="footer-link-privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" data-testid="footer-link-terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund" data-testid="footer-link-refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10">
          <p data-testid="footer-disclaimer" className="text-xs leading-relaxed text-slate-500 max-w-3xl">
            FormEase is an independent application assistance service and is not a government
            website or government authority unless explicitly stated and legally authorized.
            FormEase provides assistance with completing applications; it does not issue PAN
            cards, licences, scholarships or government certificates, and is not affiliated
            with the Income Tax Department, Parivahan, any state government or any scholarship authority.
          </p>
          <p className="text-xs text-slate-500 mt-4">© {new Date().getFullYear()} FormEase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
