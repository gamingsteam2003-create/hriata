import { lazy, Suspense, useEffect } from "react";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, CreditCard, ClipboardList, GraduationCap, IdCard, Car,
  ArrowRight, CheckCircle2, Phone, Mail, MessageCircle, Clock, FileEdit,
  UploadCloud, BadgeCheck, Lock
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SERVICES } from "../lib/services";

const Hero3D = lazy(() => import("../components/Hero3D"));

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" },
};

const SERVICE_ICONS = { scholarship: GraduationCap, pan: IdCard, learner: Car };

function HeroFallback() {
  return (
    <div className="w-full h-full relative flex items-center justify-center" data-testid="hero-3d-fallback">
      <div className="w-56 h-72 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-[0_20px_40px_rgb(0,0,0,0.08)] animate-float-slow p-6">
        <div className="w-16 h-2 rounded bg-royal mb-4" />
        <div className="w-full h-2 rounded bg-slate-200 mb-3" />
        <div className="w-4/5 h-2 rounded bg-slate-200 mb-3" />
        <div className="w-3/5 h-2 rounded bg-slate-200" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const t = setTimeout(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [location]);

  const whatsappNumber = (process.env.REACT_APP_CONTACT_WHATSAPP || "").replace(/\D/g, "");

  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white" data-testid="hero-section">
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.25) 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-20 md:pt-40 md:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span data-testid="hero-badge" className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-semibold text-royal tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" /> Professional Application Assistance
              </span>
              <h1 data-testid="hero-heading" className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-slate-900 leading-[1.05]">
                Your Forms.<br />
                <span className="text-royal">Simplified.</span>
              </h1>
              <p data-testid="hero-subtext" className="mt-6 text-base md:text-lg leading-relaxed text-slate-600 max-w-xl">
                Get professional assistance with Scholarship, PAN Card and Learner's Licence
                applications — all through one simple and secure platform.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link to="/#services" data-testid="hero-get-started-btn"
                  className="inline-flex items-center gap-2 rounded-full bg-royal px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 hover:bg-royal-hover hover:-translate-y-0.5 active:scale-95 transition-[background-color,transform,box-shadow]">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/track" data-testid="hero-track-btn"
                  className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-7 py-3.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 active:scale-95 transition-[background-color,transform,box-shadow]">
                  <ClipboardList className="w-4 h-4" /> Track Application
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-royal" /> Application</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-5 relative h-[380px] sm:h-[440px]">
            <Suspense fallback={<HeroFallback />}>
              {isDesktop ? <Hero3D /> : <HeroFallback />}
            </Suspense>
            <div className="absolute top-6 left-2 sm:left-6 rounded-full bg-white/80 backdrop-blur-xl border border-white/40 shadow-md px-4 py-1.5 text-xs font-semibold text-slate-700 animate-float-slow">Secure</div>
            <div className="absolute top-1/3 right-0 rounded-full bg-white/80 backdrop-blur-xl border border-white/40 shadow-md px-4 py-1.5 text-xs font-semibold text-slate-700 animate-float-slow" style={{ animationDelay: "1.2s" }}>Simple</div>
            <div className="absolute bottom-16 left-4 rounded-full bg-white/80 backdrop-blur-xl border border-white/40 shadow-md px-4 py-1.5 text-xs font-semibold text-slate-700 animate-float-slow" style={{ animationDelay: "2s" }}>Professional</div>
            <div className="absolute bottom-4 right-6 rounded-full bg-navy text-white shadow-lg px-4 py-1.5 text-xs font-semibold animate-float-slow" style={{ animationDelay: "0.6s" }}>From ₹100 per service</div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-24 bg-white" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">Why FormEase</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Simple. Secure. Transparent.</h2>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: "Secure Documents", text: "Your uploaded documents are handled through a secure application workflow with private, authenticated access.", testid: "trust-secure" },
              { icon: CreditCard, title: "Transparent Pricing", text: "Every service has a clear fixed fee shown upfront — ₹100 for Scholarship and PAN Card, ₹350 for Learner's Licence. No hidden charges, ever.", testid: "trust-pricing" },
              { icon: ClipboardList, title: "Application Tracking", text: "Track the progress of your application anytime using your unique Application ID.", testid: "trust-tracking" },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                data-testid={f.testid}
                className="rounded-2xl bg-slate-50 border border-slate-100 p-8 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
                <span className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-white" />
                </span>
                <h3 className="text-xl font-medium tracking-tight text-slate-900">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-slate-50" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">What we do</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Our Services</h2>
            <p className="mt-4 text-base text-slate-600">Professional assistance for the applications you need.</p>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(SERVICES).map((s, i) => {
              const Icon = SERVICE_ICONS[s.key];
              return (
                <motion.div key={s.key} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                  data-testid={`service-card-${s.key}`}
                  className="h-full flex flex-col bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
                  <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-navy to-royal flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20">
                    <Icon className="w-7 h-7 text-white" />
                  </span>
                  <h3 className="text-xl sm:text-2xl font-medium tracking-tight text-slate-900">{s.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 flex-1">{s.description}</p>
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assistance fee</p>
                      <p className="text-3xl font-semibold text-slate-900 font-heading">₹{s.fee}</p>
                    </div>
                  </div>
                  <Link to={`/apply/${s.key}`} data-testid={`service-apply-${s.key}`}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-royal px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-95 transition-[background-color,transform]">
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">The process</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">How It Works</h2>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileEdit, step: "01", title: "Choose a Service", text: "Pick Scholarship, PAN Card or Learner's Licence and fill a simple guided form." },
              { icon: UploadCloud, step: "02", title: "Upload Documents", text: "Securely upload the required documents with our drag-and-drop uploader." },
              { icon: CreditCard, step: "03", title: "Pay Securely", text: "Complete a secure payment of your service fee. Your application is verified on our servers." },
              { icon: BadgeCheck, step: "04", title: "Track & Relax", text: "Get your Application ID and track every status update in real time." },
            ].map((s, i) => (
              <motion.div key={s.step} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                data-testid={`how-step-${i + 1}`} className="relative">
                <p className="text-6xl font-heading font-semibold text-slate-100">{s.step}</p>
                <span className="absolute top-3 left-14 w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-royal" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 bg-navy-deep" data-testid="cta-banner">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Ready to simplify your application?</h2>
            <p className="mt-3 text-slate-400 text-base">One platform. Three services. Simple fixed pricing from ₹100.</p>
          </div>
          <Link to="/#services" data-testid="cta-apply-btn"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-navy shadow-xl hover:-translate-y-0.5 active:scale-95 transition-transform shrink-0">
            Start Your Application <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-slate-50" data-testid="contact-section">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">Get in touch</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">Contact Us</h2>
            <p className="mt-4 text-base text-slate-600">Questions about your application? We're here to help.</p>
          </motion.div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Phone, label: "Phone", value: process.env.REACT_APP_CONTACT_PHONE, testid: "contact-phone", href: `tel:${(process.env.REACT_APP_CONTACT_PHONE || "").replace(/\s/g, "")}` },
              { icon: Mail, label: "Email", value: process.env.REACT_APP_CONTACT_EMAIL, testid: "contact-email", href: `mailto:${process.env.REACT_APP_CONTACT_EMAIL}` },
              { icon: MessageCircle, label: "WhatsApp", value: process.env.REACT_APP_CONTACT_WHATSAPP, testid: "contact-whatsapp", href: `https://wa.me/${whatsappNumber}`, external: true },
              { icon: Clock, label: "Business Hours", value: process.env.REACT_APP_BUSINESS_HOURS, testid: "contact-hours" },
            ].map((c) => {
              const inner = (
                <>
                  <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-royal" />
                  </span>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">{c.label}</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800">{c.value}</p>
                  {c.href && <p className="mt-1 text-xs font-medium text-royal">{c.external ? "Chat now" : "Tap to connect"}</p>}
                </>
              );
              const cls = "block bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-[box-shadow,transform] duration-300";
              return c.href ? (
                <a key={c.label} href={c.href} data-testid={c.testid} className={cls}
                  {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                  {inner}
                </a>
              ) : (
                <div key={c.label} data-testid={c.testid} className={cls}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating WhatsApp button */}
      <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" data-testid="whatsapp-float-btn"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
       <WhatsAppIcon className="w-5 h-5 text-emerald-500" />
      </a>

      <Footer />
    </div>
  );
}
