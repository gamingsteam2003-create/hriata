import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CheckCircle2, Circle, Loader2, AlertCircle, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { formatApiError } from "../lib/api";
import { TRACK_STEPS, trackProgress, STATUS_LABELS, STATUS_COLORS, SERVICES } from "../lib/services";

export default function Track() {
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const track = async (e) => {
    e?.preventDefault();
    if (!appId.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.get(`/applications/track/${encodeURIComponent(appId.trim())}`);
      setResult(data);
    } catch (err) {
      setError(formatApiError(err, "Application not found"));
    } finally {
      setLoading(false);
    }
  };

  const progress = result ? trackProgress(result.status, result.payment_status) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">Application status</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900">Track Your Application</h1>
            <p className="mt-4 text-base text-slate-600">Enter the Application ID you received after submission.</p>

            <form onSubmit={track} className="mt-8 flex gap-3" data-testid="track-form">
              <input
                value={appId}
                onChange={(e) => setAppId(e.target.value.toUpperCase())}
                placeholder="FE-2026-00001"
                data-testid="track-input"
                className="flex-1 h-14 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium tracking-wide shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color]"
              />
              <button type="submit" disabled={loading} data-testid="track-submit-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-royal px-6 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-95 transition-[background-color,transform] disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track
              </button>
            </form>

            {error && (
              <div data-testid="track-error" className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} data-testid="track-result"
                className="mt-10 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Application ID</p>
                    <p className="text-xl font-heading font-semibold text-slate-900" data-testid="track-result-id">{result.application_id}</p>
                  </div>
                  <span data-testid="track-result-status" className={`text-xs font-bold px-3 py-1.5 rounded-full ${STATUS_COLORS[result.status]}`}>
                    {STATUS_LABELS[result.status]}
                  </span>
                </div>

                <div className="py-7 space-y-0" data-testid="track-timeline">
                  {TRACK_STEPS.map((s, i) => {
                    const done = progress[s.key];
                    const isLast = i === TRACK_STEPS.length - 1;
                    const isCurrent = done && (isLast ? result.status === "completed" : !progress[TRACK_STEPS[i + 1].key]);
                    return (
                      <div key={s.key} className="flex gap-4" data-testid={`track-step-${s.key}`}>
                        <div className="flex flex-col items-center">
                          {done ? (
                            <CheckCircle2 className={`w-6 h-6 ${isCurrent ? "text-royal" : "text-emerald-500"}`} />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300" />
                          )}
                          {!isLast && <div className={`w-0.5 h-8 ${done && progress[TRACK_STEPS[i + 1].key] ? "bg-emerald-400" : "bg-slate-200"}`} />}
                        </div>
                        <p className={`pt-0.5 text-sm font-medium ${done ? "text-slate-900" : "text-slate-400"}`}>{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Service</p>
                    <p className="font-semibold text-slate-800" data-testid="track-result-service">{result.service_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Payment</p>
                    <p className="font-semibold text-slate-800" data-testid="track-result-payment">
                      {result.payment_status === "paid" ? `₹${SERVICES[result.service_type]?.fee} — Successful` : "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Submitted</p>
                    <p className="font-semibold text-slate-800">{new Date(result.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Last updated</p>
                    <p className="font-semibold text-slate-800">{new Date(result.last_updated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
