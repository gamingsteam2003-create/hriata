import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FileCheck2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import api, { formatApiError } from "../lib/api";

export default function Auth({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);
  const [resetDone, setResetDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const redirectFor = (user) => {
    if (user.role === "admin" && (next === "/dashboard" || next === "/")) return "/admin";
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
        navigate(redirectFor(user), { replace: true });
      } else if (mode === "register") {
        if (form.password !== form.confirm) { setError("Passwords do not match"); setLoading(false); return; }
        const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        toast.success("Account created successfully");
        navigate(redirectFor(user), { replace: true });
      } else if (mode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", { email: form.email });
        setResetInfo(data.dev_reset_link || "sent");
      } else if (mode === "reset") {
        const token = params.get("token") || "";
        if (form.password !== form.confirm) { setError("Passwords do not match"); setLoading(false); return; }
        await api.post("/auth/reset-password", { token, password: form.password });
        setResetDone(true);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: ["Welcome back", "Log in to manage your applications."],
    register: ["Create your account", "Start your application in minutes."],
    forgot: ["Reset your password", "We'll prepare a secure reset link."],
    reset: ["Choose a new password", "Enter your new password below."],
  };

  const inputCls = "w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-[box-shadow,border-color]";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-12">
      <Link to="/" data-testid="auth-home-link" className="flex items-center gap-2.5 mb-8">
        <span className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-md">
          <FileCheck2 className="w-5 h-5 text-white" />
        </span>
        <span className="font-heading font-semibold text-xl text-slate-900">FormEase</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-[0_20px_40px_rgb(0,0,0,0.06)] p-8"
        data-testid={`auth-card-${mode}`}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titles[mode][0]}</h1>
        <p className="mt-1.5 text-sm text-slate-500">{titles[mode][1]}</p>

        {mode === "forgot" && resetInfo ? (
          <div className="mt-6" data-testid="forgot-success">
            <p className="text-sm text-slate-600">If an account exists for this email, a password reset link has been generated.</p>
            {resetInfo !== "sent" && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Demo Mode — reset link</p>
                <a href={resetInfo} data-testid="dev-reset-link" className="text-sm text-royal font-medium break-all hover:underline">{resetInfo}</a>
              </div>
            )}
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-royal hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        ) : mode === "reset" && resetDone ? (
          <div className="mt-6" data-testid="reset-success">
            <p className="text-sm text-slate-600">Your password has been updated successfully.</p>
            <Link to="/login" data-testid="reset-login-link" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-royal hover:underline">
              Continue to login <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4" data-testid="auth-form">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                  <input required value={form.name} onChange={set("name")} data-testid="auth-name-input" className={inputCls} placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Number</label>
                  <input required value={form.phone} onChange={set("phone")} data-testid="auth-phone-input" className={inputCls} placeholder="10-digit mobile number" maxLength={10} />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <input required type="email" value={form.email} onChange={set("email")} data-testid="auth-email-input" className={inputCls} placeholder="you@example.com" />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {mode === "reset" ? "New Password" : "Password"}
                </label>
                <input required type="password" value={form.password} onChange={set("password")} data-testid="auth-password-input" className={inputCls} placeholder="Minimum 8 characters" minLength={8} />
              </div>
            )}
            {(mode === "register" || mode === "reset") && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <input required type="password" value={form.confirm} onChange={set("confirm")} data-testid="auth-confirm-input" className={inputCls} placeholder="Repeat password" minLength={8} />
              </div>
            )}

            {error && <p data-testid="auth-error" className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}

            <button type="submit" disabled={loading} data-testid="auth-submit-btn"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-royal py-3.5 text-sm font-semibold text-white shadow-md hover:bg-royal-hover active:scale-[0.98] transition-[background-color,transform] disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {{ login: "Log in", register: "Create account", forgot: "Send reset link", reset: "Update password" }[mode]}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
          {mode === "login" && (
            <>
              <p><Link to="/forgot-password" data-testid="auth-forgot-link" className="font-medium text-royal hover:underline">Forgot password?</Link></p>
              <p>New to FormEase? <Link to={`/register${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} data-testid="auth-register-link" className="font-semibold text-royal hover:underline">Create an account</Link></p>
            </>
          )}
          {mode === "register" && (
            <p>Already have an account? <Link to="/login" data-testid="auth-login-link" className="font-semibold text-royal hover:underline">Log in</Link></p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
