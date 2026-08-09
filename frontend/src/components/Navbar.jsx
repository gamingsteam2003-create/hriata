import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, FileCheck2, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Track Application", href: "/track" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header
      data-testid="main-navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled ? "bg-white/75 backdrop-blur-xl border-b border-white/40 shadow-[0_4px_24px_rgb(2,6,23,0.06)]" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between">
        <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <FileCheck2 className="w-5 h-5 text-white" />
          </span>
          <span className="font-heading font-semibold text-lg tracking-tight text-slate-900">FormEase</span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.href} data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-slate-600 hover:text-royal transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} data-testid="nav-dashboard-btn"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-royal transition-colors px-3 py-2">
                {user.role === "admin" ? <ShieldCheck className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                {user.role === "admin" ? "Admin" : "Dashboard"}
              </Link>
              <button onClick={handleLogout} data-testid="nav-logout-btn"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors px-3 py-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login" data-testid="nav-login-btn"
              className="text-sm font-medium text-slate-700 hover:text-royal transition-colors px-3 py-2">
              Log in
            </Link>
          )}
          <Link to="/#services" data-testid="nav-apply-now-btn"
            className="inline-flex items-center rounded-full bg-royal px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-royal-hover hover:-translate-y-0.5 active:scale-95 transition-[background-color,transform,box-shadow]">
            Apply Now
          </Link>
        </div>

        <button className="lg:hidden p-2 text-slate-700" data-testid="nav-hamburger-btn"
          onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div data-testid="mobile-nav-drawer" className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-xl">
          <div className="px-6 py-4 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.label} to={l.href} onClick={() => setOpen(false)}
                data-testid={`mobile-nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="py-3 text-base font-medium text-slate-700 border-b border-slate-50">
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-4 pb-2">
              {user ? (
                <>
                  <Link to={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}
                    data-testid="mobile-nav-dashboard"
                    className="flex-1 text-center rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700">
                    {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                  </Link>
                  <button onClick={handleLogout} data-testid="mobile-nav-logout"
                    className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} data-testid="mobile-nav-login"
                  className="flex-1 text-center rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700">
                  Log in
                </Link>
              )}
              <Link to="/#services" onClick={() => setOpen(false)} data-testid="mobile-nav-apply"
                className="flex-1 text-center rounded-full bg-royal py-3 text-sm font-semibold text-white">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
