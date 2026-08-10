import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Track from "./pages/Track";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Apply from "./pages/Apply";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/admin/Admin";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminApplicationDetail from "./pages/admin/AdminApplicationDetail";
import Legal from "./pages/Legal";
import { Loader2 } from "lucide-react";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="page-loader">
      <Loader2 className="w-8 h-8 text-royal animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === null) return <FullPageLoader />;
  if (user === false) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user === null) return <FullPageLoader />;
  if (user === false) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  // Detect OAuth session_id synchronously during render (before ProtectedRoute runs)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/track" element={<Track />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/forgot-password" element={<Auth mode="forgot" />} />
      <Route path="/reset-password" element={<Auth mode="reset" />} />
      <Route path="/apply/:serviceKey" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
      <Route path="/admin/applications/:applicationId" element={<AdminRoute><AdminApplicationDetail /></AdminRoute>} />
      <Route path="/privacy" element={<Legal type="privacy" />} />
      <Route path="/terms" element={<Legal type="terms" />} />
      <Route path="/refund" element={<Legal type="refund" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
