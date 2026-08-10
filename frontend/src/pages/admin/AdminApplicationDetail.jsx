import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2, ArrowLeft, FileText, CheckCircle2, RotateCcw, AlertTriangle,
  StickyNote, Send, User, CreditCard, FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "./AdminLayout";
import api, { formatApiError } from "../../lib/api";
import { SERVICES, STATUS_LABELS, STATUS_COLORS } from "../../lib/services";

const NEXT_STATUSES = ["submitted", "documents_under_review", "processing", "need_more_info", "completed"];

export default function AdminApplicationDetail() {
  const { applicationId } = useParams();
  const [app, setApp] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get(`/admin/applications/${applicationId}`)
      .then(({ data }) => { setApp(data); setStatus(data.status); })
      .catch((e) => setError(formatApiError(e)));
  };
  useEffect(load, [applicationId]);

  if (error) {
    return <AdminLayout><p className="text-red-600 text-sm" data-testid="admin-detail-error">{error}</p></AdminLayout>;
  }
  if (!app) {
    return <AdminLayout><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-royal animate-spin" /></div></AdminLayout>;
  }

  const updateStatus = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/applications/${applicationId}/status`, { status, note: statusNote });
      setApp(data);
      setStatusNote("");
      toast.success("Status updated");
    } catch (e) { toast.error(formatApiError(e)); }
    setBusy(false);
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.post(`/admin/applications/${applicationId}/notes`, { note });
      toast.success("Note added");
      setNote("");
      load();
    } catch (e) { toast.error(formatApiError(e)); }
    setBusy(false);
  };

  const docAction = async (docType, action) => {
    try {
      const { data } = await api.patch(`/admin/applications/${applicationId}/documents/${docType}`, { action });
      setApp((prev) => ({ ...prev, ...data }));
      toast.success(action === "verify" ? "Document verified" : action === "request_replacement" ? "Replacement requested" : "Verification removed");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const docUrl = (d) => `${process.env.REACT_APP_BACKEND_URL}/api/documents/${applicationId}/${d.stored_name}`;

  return (
    <AdminLayout>
      <Link to="/admin/applications" data-testid="admin-detail-back" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-royal mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to applications
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900" data-testid="admin-detail-id">{app.application_id}</h1>
          <p className="mt-1 text-sm text-slate-500">{SERVICES[app.service_type]?.name} · Submitted {new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <span className={`text-xs font-bold px-4 py-2 rounded-full ${STATUS_COLORS[app.status]}`} data-testid="admin-detail-status">
          {STATUS_LABELS[app.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-customer">
            <div className="flex items-center gap-2 mb-4"><User className="w-4 h-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-800">Customer</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Name</p><p className="font-medium text-slate-800">{app.applicant_data?.full_name || app.customer?.name}</p></div>
              <div><p className="text-xs text-slate-400">Mobile</p><p className="font-medium text-slate-800">{app.applicant_data?.mobile || app.customer?.phone || "—"}</p></div>
              <div><p className="text-xs text-slate-400">Email</p><p className="font-medium text-slate-800 break-all">{app.applicant_data?.email || app.customer?.email}</p></div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {Object.entries(app.applicant_data || {}).filter(([k]) => !["full_name", "mobile", "email"].includes(k)).map(([k, v]) => (
                <div key={k} className="text-sm">
                  <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g, " ")}</p>
                  <p className="font-medium text-slate-700 break-words">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-documents">
            <div className="flex items-center gap-2 mb-4"><FolderOpen className="w-4 h-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-800">Documents ({app.documents?.length || 0})</h3></div>
            {(!app.documents || app.documents.length === 0) ? (
              <p className="text-sm text-slate-400">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {app.documents.map((d) => (
                  <div key={d.doc_type} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-4" data-testid={`admin-doc-${d.doc_type}`}>
                    <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-royal" />
                    </span>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm font-medium text-slate-800">{d.label}</p>
                      <p className="text-xs text-slate-400">{d.file_name} {d.size ? `· ${(d.size / 1024).toFixed(0)} KB` : ""}</p>
                    </div>
                    {d.verified && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Verified</span>}
                    {d.replacement_requested && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-orange-50 text-orange-700">Replacement requested</span>}
                    <div className="flex items-center gap-2">
                      {d.stored_name && (
                        <a href={docUrl(d)} target="_blank" rel="noreferrer" data-testid={`admin-doc-view-${d.doc_type}`}
                          className="text-xs font-semibold text-royal hover:underline">View</a>
                      )}
                      {!d.verified ? (
                        <button onClick={() => docAction(d.doc_type, "verify")} data-testid={`admin-doc-verify-${d.doc_type}`}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                        </button>
                      ) : (
                        <button onClick={() => docAction(d.doc_type, "unverify")} data-testid={`admin-doc-unverify-${d.doc_type}`}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" /> Unverify
                        </button>
                      )}
                      <button onClick={() => docAction(d.doc_type, "request_replacement")} data-testid={`admin-doc-replace-${d.doc_type}`}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5" /> Request replacement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-notes">
            <div className="flex items-center gap-2 mb-4"><StickyNote className="w-4 h-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-800">Private Admin Notes</h3></div>
            <div className="space-y-3 mb-4">
              {(app.admin_notes || []).length === 0 && <p className="text-sm text-slate-400">No notes yet. Notes are private and never shown to customers.</p>}
              {(app.admin_notes || []).map((n, i) => (
                <div key={i} className="rounded-xl bg-amber-50/60 border border-amber-100 p-4">
                  <p className="text-sm text-slate-700">{n.note}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{n.by} · {new Date(n.at).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input value={note} onChange={(e) => setNote(e.target.value)} data-testid="admin-note-input"
                placeholder="e.g. Applicant needs to upload a clearer photograph."
                className="flex-1 h-11 rounded-xl border border-slate-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              <button onClick={addNote} disabled={busy || !note.trim()} data-testid="admin-note-add-btn"
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-800 transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-payment">
            <div className="flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-800">Payment</h3></div>
            <p className="text-3xl font-heading font-semibold text-slate-900">₹{SERVICES[app.service_type]?.fee}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-full ${app.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {app.payment_status === "paid" ? "Successful" : "Pending"}
            </span>
            {app.payment && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <p>Order: <span className="font-medium text-slate-700">{app.payment.order_id}</span></p>
                {app.payment.payment_id && <p>Payment: <span className="font-medium text-slate-700">{app.payment.payment_id}</span></p>}
                <p>Mode: <span className="font-medium text-slate-700 capitalize">{app.payment.mode}</span></p>
                {app.payment.verified_at && <p>Verified: <span className="font-medium text-slate-700">{new Date(app.payment.verified_at).toLocaleString("en-IN")}</span></p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-status-control">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Update Status</h3>
            <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="admin-status-select"
              className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              {NEXT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} data-testid="admin-status-note"
              placeholder="Optional note with this update"
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <button onClick={updateStatus} disabled={busy || status === app.status} data-testid="admin-status-update-btn"
              className="mt-4 w-full rounded-full bg-royal py-3 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-[0.98] transition-[background-color,transform] disabled:opacity-50">
              {busy ? "Updating…" : "Update Status"}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="admin-detail-history">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Status History</h3>
            <div className="space-y-3">
              {(app.status_history || []).slice().reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status] || "bg-slate-100 text-slate-500"}`}>{STATUS_LABELS[h.status] || h.status}</span>
                  <span className="text-xs text-slate-400">{new Date(h.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
