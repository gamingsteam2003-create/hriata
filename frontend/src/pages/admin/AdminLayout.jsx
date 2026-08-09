import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileCheck2, LayoutDashboard, Table2, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function AdminLayout({ children, title, subtitle }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, testid: "admin-nav-overview" },
    { label: "Applications", href: "/admin/applications", icon: Table2, testid: "admin-nav-applications" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[250px_1fr]" data-testid="admin-layout">
      <aside className="bg-navy-deep text-slate-300 lg:min-h-screen flex lg:flex-col">
        <div className="flex lg:flex-col w-full">
          <div className="flex items-center gap-2.5 px-6 py-5">
            <span className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="font-heading font-semibold text-white leading-none">FormEase</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Admin</p>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1 px-3 lg:px-4 lg:mt-6 flex-1 items-center lg:items-stretch">
            {navItems.map((n) => {
              const active = location.pathname === n.href;
              return (
                <Link key={n.href} to={n.href} data-testid={n.testid}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"
                  }`}>
                  <n.icon className="w-4 h-4" /> <span className="hidden sm:inline">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex lg:flex-col gap-1 px-3 lg:px-4 py-4 items-center lg:items-stretch">
            <Link to="/" data-testid="admin-nav-site" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" /> <span className="hidden sm:inline">View Site</span>
            </Link>
            <button onClick={handleLogout} data-testid="admin-logout-btn"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-red-300 transition-colors text-left">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="p-5 sm:p-8 lg:p-10 min-w-0">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900" data-testid="admin-page-title">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
