import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Loader2, ArrowRight, GraduationCap, IdCard, Car, User, Mail, Phone } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SERVICES, STATUS_LABELS, STATUS_COLORS } from "../lib/services";

const ICONS = { scholarship: GraduationCap, pan: IdCard, learner: Car };

export default function Dashboard() {
  const { user } = useAuth();
  const [apps, setApps] = useState(null);

  useEffect(() => {
    api.get("/applications/mine").then(({ data }) => setApps(data)).catch(() => setApps([]));
  }, []);

  const submitted = (apps || []).filter((a) => a.status !== "draft");
  const drafts = (apps || []).filter((a) => a.status === "draft");
  const paid = submitted.filter((a) => a.payment_status === "paid");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">My Account</p>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900" data-testid="dashboard-title">
                Hello, {user?.name?.split(" ")[0]}
              </h1>
            </div>
            <Link to="/#services" data-testid="dashboard-new-application-btn"
              className="inline-flex items-center gap-2 rounded-full bg-royal px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-95 transition-[background-color,transform]">
              <Plus className="w-4 h-4" /> New Application
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="profile-card">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-navy flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate" data-testid="profile-name">{user?.name}</p>
                  <p className="text-xs text-slate-400 font-medium capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5 text-sm">
                <p className="flex items-center gap-2.5 text-slate-600"><Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{user?.email}</span></p>
                {user?.phone && <p className="flex items-center gap-2.5 text-slate-600"><Phone className="w-4 h-4 text-slate-400" /> {user.phone}</p>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="stats-applications">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Applications</p>
              <p className="mt-2 text-4xl font-heading font-semibold text-slate-900">{submitted.length}</p>
              <p className="mt-1 text-xs text-slate-500">{drafts.length} draft{drafts.length === 1 ? "" : "s"} in progress</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="stats-payments">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Paid</p>
              <p className="mt-2 text-4xl font-heading font-semibold text-slate-900">₹{paid.reduce((sum, a) => sum + (SERVICES[a.service_type]?.fee || 0), 0)}</p>
              <p className="mt-1 text-xs text-slate-500">{paid.length} successful payment{paid.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <h2 className="text-xl font-medium text-slate-900 mb-5">My Applications</h2>
          {apps === null ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-royal animate-spin" /></div>
          ) : apps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center" data-testid="applications-empty">
              <p className="text-slate-500 text-sm">No applications yet. Start your first one — it takes just a few minutes.</p>
              <Link to="/#services" className="mt-5 inline-flex items-center gap-2 rounded-full bg-royal px-6 py-3 text-sm font-semibold text-white">
                Browse Services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4" data-testid="applications-list">
              {apps.map((a, i) => {
                const Icon = ICONS[a.service_type];
                return (
                  <motion.div key={a.application_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    data-testid={`application-card-${a.application_id}`}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-wrap items-center gap-4">
                    <span className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-royal" />
                    </span>
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold text-slate-900">{SERVICES[a.service_type]?.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{a.application_id} · {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_COLORS[a.status]}`} data-testid={`application-status-${a.application_id}`}>
                      {STATUS_LABELS[a.status]}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${a.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {a.payment_status === "paid" ? `₹${SERVICES[a.service_type]?.fee} Paid` : "Payment Pending"}
                    </span>
                    {a.status === "draft" ? (
                      <Link to={`/apply/${a.service_type}`} data-testid={`application-continue-${a.application_id}`}
                        className="text-sm font-semibold text-royal hover:underline">Continue</Link>
                    ) : (
                      <Link to="/track" data-testid={`application-track-${a.application_id}`}
                        className="text-sm font-semibold text-royal hover:underline">Track</Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {paid.length > 0 && (
            <>
              <h2 className="text-xl font-medium text-slate-900 mt-12 mb-5">Payment History</h2>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden" data-testid="payment-history">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-3.5 font-semibold">Application</th>
                      <th className="px-6 py-3.5 font-semibold">Service</th>
                      <th className="px-6 py-3.5 font-semibold">Amount</th>
                      <th className="px-6 py-3.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paid.map((a) => (
                      <tr key={a.application_id}>
                        <td className="px-6 py-4 font-medium text-slate-800">{a.application_id}</td>
                        <td className="px-6 py-4 text-slate-600">{SERVICES[a.service_type]?.short}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">₹{SERVICES[a.service_type]?.fee}</td>
                        <td className="px-6 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Successful</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
