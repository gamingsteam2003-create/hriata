import { useEffect, useState } from "react";
import { Loader2, FileStack, Clock3, Hourglass, CheckCircle2, IndianRupee, Bell, MessageCircle, Mail } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { AdminLayout } from "./AdminLayout";
import api from "../../lib/api";

const PIE_COLORS = ["#1D4ED8", "#F59E0B", "#6366F1", "#F97316", "#10B981", "#94A3B8"];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    api.get("/admin/analytics").then(({ data }) => setAnalytics(data)).catch(() => {});
    api.get("/admin/notifications").then(({ data }) => setNotifications(data)).catch(() => {});
  }, []);

  if (!stats) {
    return <AdminLayout><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-royal animate-spin" /></div></AdminLayout>;
  }

  const cards = [
    { label: "Total Applications", value: stats.total_applications, icon: FileStack, testid: "stat-total" },
    { label: "Today's Applications", value: stats.todays_applications, icon: Clock3, testid: "stat-today" },
    { label: "Pending", value: stats.pending, icon: Hourglass, testid: "stat-pending" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, testid: "stat-completed" },
    { label: "Total Revenue", value: `₹${stats.total_revenue.toLocaleString("en-IN")}`, icon: IndianRupee, testid: "stat-revenue" },
  ];

  return (
    <AdminLayout title="Overview" subtitle={`FormEase operations at a glance · ${stats.payments_mode === "demo" ? "Demo payments active" : "Live payments"}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5" data-testid="admin-stats-grid">
        {cards.map((c) => (
          <div key={c.label} data-testid={c.testid}
            className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
              <c.icon className="w-4 h-4 text-slate-300" />
            </div>
            <p className="mt-3 text-3xl font-heading font-semibold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="chart-applications">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Applications — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics?.apps_over_time || []}>
              <defs>
                <linearGradient id="appsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={2} fill="url(#appsFill)" name="Applications" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="chart-revenue">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Revenue — Last 30 Days (₹)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics?.revenue_over_time || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} interval={6} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="chart-by-service">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Applications by Service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics?.by_service || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={false} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="#0A192F" radius={[0, 4, 4, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="chart-status">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={analytics?.status_distribution || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {(analytics?.status_distribution || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="revenue-by-service">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Revenue by Service</h3>
          <div className="space-y-4">
            {Object.entries(stats.by_service).map(([name, s]) => (
              <div key={name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{name}</p>
                  <p className="text-xs text-slate-400">{s.applications} applications</p>
                </div>
                <p className="text-lg font-heading font-semibold text-slate-900">₹{s.revenue.toLocaleString("en-IN")}</p>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">Today: <span className="font-semibold text-slate-800">₹{stats.today_revenue.toLocaleString("en-IN")}</span></span>
              <span className="text-slate-500">This month: <span className="font-semibold text-slate-800">₹{stats.month_revenue.toLocaleString("en-IN")}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" data-testid="notifications-log">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">Recent Notifications</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Mocked</span>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications yet. They appear here after new applications.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 text-sm" data-testid={`notification-${n.id}`}>
                  {n.channel === "whatsapp"
                    ? <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-slate-700 whitespace-pre-line text-xs leading-relaxed line-clamp-3">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.channel} · {n.status} · {new Date(n.created_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
