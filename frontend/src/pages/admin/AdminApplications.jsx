import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Eye } from "lucide-react";
import { AdminLayout } from "./AdminLayout";
import api from "../../lib/api";
import { SERVICES, STATUS_LABELS, STATUS_COLORS } from "../../lib/services";

const FILTERS = [
  { key: "", label: "All" },
  { key: "scholarship", label: "Scholarship", type: "service" },
  { key: "pan", label: "PAN", type: "service" },
  { key: "learner", label: "Learner's Licence", type: "service" },
  { key: "submitted", label: "Pending", type: "status" },
  { key: "processing", label: "Processing", type: "status" },
  { key: "completed", label: "Completed", type: "status" },
];

export default function AdminApplications() {
  const [apps, setApps] = useState(null);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setApps(null);
    const params = {};
    if (filter.type === "service") params.service = filter.key;
    if (filter.type === "status") params.status = filter.key;
    if (search.trim()) params.search = search.trim();
    const t = setTimeout(() => {
      api.get("/admin/applications", { params }).then(({ data }) => setApps(data)).catch(() => setApps([]));
    }, 250);
    return () => clearTimeout(t);
  }, [filter, search]);

  return (
    <AdminLayout title="Applications" subtitle="Review, verify and process customer applications">
      <div className="flex flex-wrap items-center gap-2 mb-5" data-testid="admin-filters">
        {FILTERS.map((f) => (
          <button key={f.label} onClick={() => setFilter(f)} data-testid={`filter-${f.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              filter.label === f.label ? "bg-navy text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}>
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="admin-search-input"
            placeholder="Search ID, name or mobile"
            className="h-10 w-64 rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden" data-testid="admin-applications-table">
        {apps === null ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-royal animate-spin" /></div>
        ) : apps.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-400" data-testid="admin-applications-empty">No applications match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3.5 font-semibold">Application ID</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Service</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Docs</th>
                  <th className="px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map((a) => (
                  <tr key={a.application_id} className="hover:bg-slate-50/60 transition-colors" data-testid={`admin-row-${a.application_id}`}>
                    <td className="px-5 py-4 font-semibold text-slate-800">{a.application_id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{a.applicant_data?.full_name || "—"}</p>
                      <p className="text-xs text-slate-400">{a.applicant_data?.mobile || ""}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{SERVICES[a.service_type]?.short}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {a.payment_status === "paid" ? "₹250 Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[a.status]}`}>{STATUS_LABELS[a.status]}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{a.documents?.length || 0}</td>
                    <td className="px-5 py-4">
                      <Link to={`/admin/applications/${a.application_id}`} data-testid={`admin-view-${a.application_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-royal hover:underline">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
