import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, Loader2, PartyPopper, Copy,
  ShieldCheck, CreditCard, AlertCircle, FileCheck2
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import api, { formatApiError } from "../lib/api";
import { SERVICES } from "../lib/services";
import { INDIAN_STATES, filterName, validateFullName, validateEmail } from "../lib/validation";

const STEPS = ["Personal Details", "Application Details", "Documents", "Review", "Payment", "Submitted"];

const PERSONAL_FIELDS = [
  { name: "full_name", label: "Full Name", required: true, placeholder: "As per official records", filter: filterName, validate: validateFullName },
  { name: "dob", label: "Date of Birth", required: true, type: "date" },
  { name: "gender", label: "Gender", required: true, type: "select", options: ["Male", "Female", "Other"] },
  { name: "mobile", label: "Mobile Number", required: true, placeholder: "10-digit mobile number", maxLength: 10, pattern: /^\d{10}$/, patternMsg: "Enter a valid 10-digit mobile number" },
  { name: "email", label: "Email", required: true, type: "email", placeholder: "you@example.com", validate: validateEmail },
  { name: "address", label: "Address", required: true, type: "textarea", placeholder: "House / street / locality" },
  { name: "city", label: "City", required: true, placeholder: "City" },
  { name: "state", label: "State", required: true, type: "select", placeholder: "Select State", options: INDIAN_STATES },
  { name: "pin", label: "PIN Code", required: true, placeholder: "6-digit PIN", maxLength: 6, pattern: /^\d{6}$/, patternMsg: "Enter a valid 6-digit PIN code" },
];

const MIZORAM_CITIES = ["Aizawl", "Lunglei", "Champhai", "Siaha", "Kolasib", "Serchhip", "Lawngtlai", "Mamit"];

const inputCls = "w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color]";
const errCls = "border-red-300 focus:border-red-500 focus:ring-red-500/20";

function Field({ field, value, onChange, error }) {
  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.type === "select" ? (
        <select value={value || ""} onChange={(e) => onChange(field.name, e.target.value)}
          data-testid={`field-${field.name}`}
          className={`${inputCls} ${error ? errCls : ""} ${!value ? "text-slate-400" : ""}`}>
          <option value="">{field.placeholder || `Select ${field.label}`}</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea value={value || ""} onChange={(e) => onChange(field.name, e.target.value)} rows={2}
          data-testid={`field-${field.name}`} placeholder={field.placeholder}
          className={`${inputCls} h-auto py-3 ${error ? errCls : ""}`} />
      ) : (
        <input type={field.type || "text"} value={value || ""}
          onChange={(e) => onChange(field.name, field.filter ? field.filter(e.target.value) : e.target.value)}
          data-testid={`field-${field.name}`} placeholder={field.placeholder} maxLength={field.maxLength}
          className={`${inputCls} ${error ? errCls : ""}`} />
      )}
      {error && <p className="mt-1 text-xs text-red-600" data-testid={`field-${field.name}-error`}>{error}</p>}
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2" data-testid="wizard-stepper">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                done ? "bg-emerald-500 text-white" : active ? "bg-royal text-white shadow-lg shadow-blue-700/30" : "bg-slate-100 text-slate-400"
              }`} data-testid={`stepper-step-${n}`}>
                {done ? <Check className="w-4 h-4" /> : `0${n}`}
              </div>
              <span className={`mt-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${active ? "text-royal" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {n < STEPS.length && <div className={`flex-1 h-0.5 mx-2 sm:mx-3 mt-[-18px] ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function DemoPaymentModal({ order, onSuccess, onClose, paying }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-deep/60 backdrop-blur-sm px-5" data-testid="demo-payment-modal">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-navy px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-white" />
            <span className="text-white font-heading font-semibold">FormEase Pay</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2.5 py-1 rounded-full">Demo Mode</span>
        </div>
        <div className="p-6">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Order {order.order_id.slice(0, 20)}…</p>
          <p className="mt-2 text-4xl font-heading font-semibold text-slate-900">₹{(order.amount || 0) / 100}</p>
          <p className="mt-1 text-sm text-slate-500">Application assistance fee</p>
          <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-800 leading-relaxed">
            This is a simulated demo checkout. No real money is charged. Add Razorpay keys to enable live payments.
          </div>
          <button onClick={onSuccess} disabled={paying} data-testid="demo-pay-btn"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-royal py-3.5 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-[0.98] transition-[background-color,transform] disabled:opacity-60">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {paying ? "Processing…" : `Pay ₹${(order.amount || 0) / 100}`}
          </button>
          <button onClick={onClose} data-testid="demo-pay-cancel"
            className="mt-3 w-full text-center text-xs font-medium text-slate-400 hover:text-slate-600">
            Cancel payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Apply() {
  const { serviceKey } = useParams();
  const navigate = useNavigate();
  const service = SERVICES[serviceKey];
  const [application, setApplication] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [showDemoPay, setShowDemoPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!service) return;
    api.post("/applications", { service_type: serviceKey })
      .then(({ data }) => {
        setApplication(data);
        setForm(data.applicant_data || {});
        if (data.status !== "draft") setStep(6);
      })
      .catch((e) => setLoadError(formatApiError(e)));
  }, [serviceKey, service]);
  const docs = useMemo(() => application?.documents || [], [application]);
  const docFor = (key) => docs.find((d) => d.doc_type === key);
  const personalFields = useMemo(
    () =>
      PERSONAL_FIELDS.map((f) =>
        f.name === "city" && form.state === "Mizoram"
          ? { ...f, type: "select", options: MIZORAM_CITIES, placeholder: "Select City", filter: undefined }
          : f
      ),
    [form.state]
  );
  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Unknown service. <Link to="/" className="text-royal font-semibold">Go home</Link></p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-slate-700 font-medium">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-royal">Retry</button>
        </div>
      </div>
    );
  }
  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="apply-loading">
        <Loader2 className="w-8 h-8 text-royal animate-spin" />
      </div>
    );
  }
  const onChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const validateFields = (fields) => {
    const errs = {};
    fields.forEach((f) => {
      const v = (form[f.name] || "").trim();
      if (f.required && !v) errs[f.name] = `${f.label} is required`;
      else if (v && f.validate) { const m = f.validate(v); if (m) errs[f.name] = m; }
      else if (v && f.pattern && !f.pattern.test(v)) errs[f.name] = f.patternMsg;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const saveProgress = async () => {
    const { data } = await api.patch(`/applications/${application.application_id}`, { applicant_data: form });
    setApplication(data);
  };
  const goNext = async () => {
    if (step === 1 && !validateFields(personalFields)) { toast.error("Please fix the highlighted fields"); return; }
    if (step === 2 && !validateFields(service.detailFields)) { toast.error("Please fix the highlighted fields"); return; }
    if (step === 3) {
      const missing = service.docs.filter((d) => d.required && !docFor(d.key));
      if (missing.length) { toast.error(`Required documents missing: ${missing.map((m) => m.label).join(", ")}`); return; }
    }
    if (step <= 2) {
      setSaving(true);
      try { await saveProgress(); toast.success("Progress saved"); }
      catch (e) { toast.error(formatApiError(e)); setSaving(false); return; }
      setSaving(false);
    }
    setStep((s) => Math.min(s + 1, 6));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const startPayment = async () => {
    setPaying(true);
    try {
      const { data } = await api.post("/payments/create-order", { application_id: application.application_id });
      setOrder(data);
      if (data.mode === "demo") {
        setShowDemoPay(true);
        setPaying(false);
      } else {
        const loaded = await new Promise((resolve) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.body.appendChild(s);
        });
        if (!loaded) throw new Error("Could not load payment gateway");
        const rzp = new window.Razorpay({
          key: data.key_id, amount: data.amount, currency: data.currency,
          name: "FormEase", description: `${service.name} Assistance`, order_id: data.order_id,
          prefill: { name: form.full_name, email: form.email, contact: form.mobile },
          theme: { color: "#1D4ED8" },
          handler: async (resp) => {
            try {
              const { data: v } = await api.post("/payments/verify", {
                application_id: application.application_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              });
              setApplication(v.application);
              setStep(6);
            } catch (e) { toast.error(formatApiError(e, "Payment verification failed")); }
          },
          modal: { ondismiss: () => setPaying(false) },
        });
        rzp.open();
      }
    } catch (e) {
      toast.error(formatApiError(e, "Could not start payment"));
      setPaying(false);
    }
  };
  const completeDemoPayment = async () => {
    setPaying(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await api.post("/payments/verify", {
        application_id: application.application_id, order_id: order.order_id, demo: true,
      });
      setApplication(data.application);
      setShowDemoPay(false);
      setStep(6);
      toast.success("Payment successful");
    } catch (e) {
      toast.error(formatApiError(e, "Payment failed"));
    } finally {
      setPaying(false);
    }
  };
  const reviewRows = [
    ["Service", service.name],
    ...PERSONAL_FIELDS.filter((f) => form[f.name]).map((f) => [f.label, form[f.name]]),
    ...service.detailFields.filter((f) => form[f.name]).map((f) => [f.label, form[f.name]]),
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-28 pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-royal">{service.name}</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900" data-testid="apply-title">
              {step === 6 ? "Application Submitted" : "Application Assistance"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Application ID: <span className="font-semibold text-slate-700" data-testid="apply-app-id">{application.application_id}</span></p>
          </div>
          <Stepper step={step} />
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
              {step === 1 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-9" data-testid="step-personal">
                  <h2 className="text-xl font-medium text-slate-900 mb-6">Personal Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {personalFields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={onChange} error={errors[f.name]} />)}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-9" data-testid="step-details">
                  <h2 className="text-xl font-medium text-slate-900 mb-6">Application Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {service.detailFields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={onChange} error={errors[f.name]} />)}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div data-testid="step-documents">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-9 mb-5">
                    <h2 className="text-xl font-medium text-slate-900 mb-2">Upload Documents</h2>
                    <p className="text-sm text-slate-500 mb-6">Checklist: upload all <span className="font-semibold text-slate-700">Required</span> documents to continue. JPG, PNG or PDF, max 5MB each.</p>
                    <div className="space-y-4">
                      {service.docs.map((spec) => (
                        <FileUpload key={spec.key} applicationId={application.application_id} spec={spec}
                          doc={docFor(spec.key)} onChange={setApplication} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-9" data-testid="step-review">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-medium text-slate-900">Review Your Application</h2>
                    <button onClick={() => setStep(1)} data-testid="review-edit-btn" className="text-sm font-semibold text-royal hover:underline">Edit Application</button>
                  </div>
                  <dl className="divide-y divide-slate-100">
                    {reviewRows.map(([k, v]) => (
                      <div key={k} className="py-3 grid grid-cols-3 gap-4">
                        <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-0.5">{k}</dt>
                        <dd className="col-span-2 text-sm font-medium text-slate-800 break-words">{v}</dd>
                      </div>
                    ))}
                    <div className="py-3 grid grid-cols-3 gap-4">
                      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-0.5">Documents</dt>
                      <dd className="col-span-2 space-y-1.5">
                        {docs.map((d) => (
                          <p key={d.doc_type} className="flex items-center gap-2 text-sm text-slate-700">
                            <Check className="w-4 h-4 text-emerald-500" /> {d.label}
                          </p>
                        ))}
                      </dd>
                    </div>
                    <div className="py-4 grid grid-cols-3 gap-4">
                      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Service Fee</dt>
                      <dd className="col-span-2 text-2xl font-heading font-semibold text-slate-900">₹{service.fee}</dd>
                    </div>
                  </dl>
                </div>
              )}
              {step === 5 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-9 text-center" data-testid="step-payment">
                  <span className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                    <CreditCard className="w-8 h-8 text-royal" />
                  </span>
                  <h2 className="text-2xl font-semibold text-slate-900">Complete Payment</h2>
                  <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                    Secure payment for your {service.name} assistance. Your application is submitted only after server-side verification.
                  </p>
                  <p className="mt-6 text-5xl font-heading font-semibold text-slate-900">₹{service.fee}</p>
                  <p className="text-xs text-slate-400 mt-1">One-time assistance fee</p>
                  <button onClick={startPayment} disabled={paying} data-testid="pay-now-btn"
                    className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-royal px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 hover:bg-royal-hover active:scale-95 transition-[background-color,transform] disabled:opacity-60">
                    {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Pay ₹{service.fee} Securely
                  </button>
                  <p className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-bit encrypted · Server-verified
                  </p>
                </div>
              )}
              {step === 6 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 sm:p-10 text-center" data-testid="step-submitted">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                    <PartyPopper className="w-9 h-9 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Application Submitted Successfully</h2>
                  <p className="mt-3 text-sm text-slate-500">Keep your Application ID safe — you'll need it to track your application.</p>
                  <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-navy px-8 py-5">
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Application ID</p>
                      <p className="text-2xl font-heading font-semibold text-white tracking-wide" data-testid="success-app-id">{application.application_id}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard?.writeText(application.application_id); toast.success("Copied"); }}
                      data-testid="copy-app-id-btn" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" aria-label="Copy Application ID">
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400 font-medium">Service</p>
                      <p className="text-sm font-semibold text-slate-800">{service.name}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400 font-medium">Payment</p>
                      <p className="text-sm font-semibold text-emerald-600">₹{service.fee} — Successful</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-400 font-medium">Status</p>
                      <p className="text-sm font-semibold text-blue-700">Application Received</p>
                    </div>
                  </div>
                  <div className="mt-9 flex flex-wrap justify-center gap-4">
                    <Link to="/track" data-testid="success-track-btn"
                      className="inline-flex items-center gap-2 rounded-full bg-royal px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-95 transition-[background-color,transform]">
                      Track Application
                    </Link>
                    <Link to="/dashboard" data-testid="success-dashboard-btn"
                      className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-7 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-95 transition-[background-color,transform]">
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {step < 5 && (
            <div className="mt-8 flex items-center justify-between">
              <button onClick={() => setStep((s) => Math.max(s - 1, 1))} disabled={step === 1} data-testid="wizard-back-btn"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-[background-color,transform] disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={goNext} disabled={saving} data-testid="wizard-next-btn"
                className="inline-flex items-center gap-2 rounded-full bg-royal px-7 py-3 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-95 transition-[background-color,transform] disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {step === 4 ? `Proceed to Payment — ₹${service.fee}` : step === 3 ? "Review Application" : "Save & Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
      {showDemoPay && order && (
        <DemoPaymentModal order={order} paying={paying} onSuccess={completeDemoPayment} onClose={() => setShowDemoPay(false)} />
      )}
    </div>
  );
}
