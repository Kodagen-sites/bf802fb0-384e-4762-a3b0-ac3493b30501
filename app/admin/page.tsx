import { FK_COL, KODAGEN_SCHEMA, withSchema } from '@/lib/db-scope';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSite } from "@/lib/site-scope";
import { loadSiteConfigFromDB } from "@/lib/load-site-config";
import { getSidebarCounts } from "@/lib/admin-counts";
import type { Booking } from "@/lib/admin-types";
import DashboardView, { type DashboardData } from "./dashboard-view";


const orderStateToStatus: Record<string, Booking["status"]> = {
  pending:   "pending",
  paid:      "confirmed",
  shipped:   "checked_in",
  delivered: "checked_out",
  cancelled: "cancelled",
  refunded:  "cancelled",
};

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function timeAgo(d: Date): string {
  const sec = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  const wk = Math.round(day / 7);
  return `${wk} week${wk === 1 ? "" : "s"} ago`;
}

type OrderRow = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  status: string | null;
  total: number | string | null;
  items: unknown;
  created_at: string;
  paid_at: string | null;
};

export default async function DashboardPage() {
  const ctx = await getCurrentSite();
  if (!ctx || !ctx.site) redirect("/admin/login");

  const supabase = await createClient();

  const today = startOfDay();
  const weekAgo = addDays(today, -7);
  const tomorrow = addDays(today, 1);

  const [config, counts, { data: orderRows }, { data: inquiryRows }] = await Promise.all([
    loadSiteConfigFromDB(ctx.site.slug),
    getSidebarCounts(ctx.siteId),
    supabase.from("orders")
      .select("id, guest_name, guest_email, guest_phone, status, total, items, created_at, paid_at")
      .eq(FK_COL, ctx.siteId)
      .order("created_at", { ascending: false })
      .limit(500),
    withSchema(supabase, KODAGEN_SCHEMA).from("inquiries")
      .select("id, name, status, created_at")
      .eq(FK_COL, ctx.siteId)
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const orders: OrderRow[] = (orderRows ?? []) as OrderRow[];

  const mapOrder = (o: OrderRow): Booking => {
    const items = Array.isArray(o.items) ? (o.items as Array<{ name?: string; qty?: number }>) : [];
    const firstName = items[0]?.name ?? "Order";
    const itemCount = items.reduce((n, it) => n + (typeof it.qty === "number" ? it.qty : 1), 0);
    const totalCents = Number(o.total ?? 0);
    const isPaid = !!o.paid_at || o.status === "paid" || o.status === "shipped" || o.status === "delivered";
    return {
      id: String(o.id).slice(0, 8).toUpperCase(),
      guestName: o.guest_name || "Guest",
      guestEmail: o.guest_email ?? "",
      guestPhone: o.guest_phone ?? "",
      roomType: itemCount > 1 ? `${firstName} +${itemCount - 1}` : firstName,
      resourceId: o.id,
      roomNumber: String(o.id).slice(0, 6).toUpperCase(),
      checkIn: o.created_at,
      checkOut: o.paid_at ?? o.created_at,
      nights: 1,
      guests: itemCount || 1,
      totalPrice: Math.round(totalCents / 100),
      status: orderStateToStatus[o.status ?? "pending"] ?? "pending",
      paymentStatus: isPaid ? "paid" : "unpaid",
      bookingType: "room",
      createdAt: o.created_at,
    };
  };

  const all = orders.map(mapOrder);
  const recentBookings = [...all].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  const currentGuests = all.filter((b) => b.paymentStatus === "paid" && b.status !== "checked_out" && b.status !== "cancelled");

  const todaysOrders = orders.filter((o) => {
    const s = new Date(o.created_at);
    return s >= today && s < tomorrow;
  });
  const bookingsToday = todaysOrders.length;

  const totalRevenue = orders
    .filter((o) => !!o.paid_at)
    .reduce((sum, o) => sum + Math.round(Number(o.total ?? 0) / 100), 0);
  const revenueToday = orders
    .filter((o) => o.paid_at && new Date(o.paid_at) >= today && new Date(o.paid_at) < tomorrow)
    .reduce((sum, o) => sum + Math.round(Number(o.total ?? 0) / 100), 0);

  const bookings7d: number[] = new Array(7).fill(0);
  const revenue7d: number[] = new Array(7).fill(0);
  for (const o of orders) {
    const s = new Date(o.created_at);
    const dayIndex = Math.floor((s.getTime() - weekAgo.getTime()) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < 7) bookings7d[dayIndex] += 1;
    if (o.paid_at) {
      const p = new Date(o.paid_at);
      const pi = Math.floor((p.getTime() - weekAgo.getTime()) / 86_400_000);
      if (pi >= 0 && pi < 7) revenue7d[pi] += Math.round(Number(o.total ?? 0) / 100);
    }
  }

  const newInquiryCount = (inquiryRows ?? []).length;

  const activityFeed = recentBookings.slice(0, 10).map((b) => {
    const colorByStatus: Record<string, string> = {
      confirmed:   "#22c55e",
      pending:     "#f59e0b",
      checked_in:  "#3b82f6",
      checked_out: "#64748b",
      cancelled:   "#ef4444",
    };
    const ago = timeAgo(new Date(b.createdAt));
    const verb = b.status === "checked_out"
      ? `order delivered`
      : b.status === "cancelled"
        ? `order cancelled`
        : b.paymentStatus === "paid"
          ? `paid for ${b.roomType}`
          : `placed order for ${b.roomType}`;
    return {
      text: `${b.guestName} ${verb}`,
      time: ago,
      color: colorByStatus[b.status] ?? "#64748b",
    };
  });

  const data: DashboardData = {
    recentBookings,
    currentGuests,
    newInquiries: [],
    stats: {
      totalRevenue,
      revenueToday,
      bookingsToday,
      pageViews: 0,
      newInquiries: newInquiryCount,
      conversionRate: 0,
    },
    charts: {
      revenue7d,
      bookings7d,
      pageViews7d: new Array(7).fill(0),
      inquiries7d: new Array(7).fill(0),
    },
    activityFeed,
  };

  return <DashboardView data={data} config={config} counts={counts} />;
}
