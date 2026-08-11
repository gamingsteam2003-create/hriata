import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace(/^#/, "")).get("session_id");
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }
    api.post("/auth/google/session", { session_id: sessionId })
      .then(({ data }) => {
        setUser(data);
        window.history.replaceState(null, "", window.location.pathname);
        toast.success(`Welcome, ${data.name.split(" ")[0]}`);
        navigate(data.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      })
      .catch((e) => {
        toast.error(formatApiError(e, "Google sign-in failed"));
        navigate("/login", { replace: true });
      });
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="auth-callback-loading">
      <Loader2 className="w-8 h-8 text-royal animate-spin" />
    </div>
  );
}
