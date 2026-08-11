import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { listAdminOrders } from "@/lib/queries";
import { formatINRFromPaise, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORDER_STATUSES = ["created", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const PAGE_SIZE = 25;

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function OrdersList() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || undefined;
  const q = params.get("q") || undefined;
  const page = parseInt(params.get("page") || "1", 10);
  const [qInput, setQInput] = useState(q ?? "");
  const [exporting, setExporting] = useState(false);

  function updateParams(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setParams(next);
  }

  const query = useQuery({
    queryKey: ["admin-orders", { status, q, page }],
    queryFn: () => listAdminOrders({ status, q, page, limit: PAGE_SIZE }),
    staleTime: 10_000,
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = meta ? Math.max(1, meta.totalPages) : 1;

  async function handleExport() {
    setExporting(true);
    try {
      // No dedicated export endpoint on the backend — page through the same
      // list endpoint at its max page size instead. See MIGRATION_PLAN.md.
      const first = await listAdminOrders({ status, q, page: 1, limit: 100 });
      const total = first.meta.total;
      const totalFetchPages = Math.ceil(total / 100);
      const rest = await Promise.all(
        Array.from({ length: totalFetchPages - 1 }, (_, i) => listAdminOrders({ status, q, page: i + 2, limit: 100 }))
      );
      const allRows = [first.data, ...rest.map((r) => r.data)].flat();

      const headers = ["order_number", "created_at", "status", "payment_status", "customer_name", "customer_email", "customer_phone", "city", "state", "total_inr"];
      const lines = [headers.join(",")];
      for (const r of allRows) {
        lines.push(
          [r.orderNumber, r.createdAt, r.status, r.paymentStatus, r.customerName, r.customerEmail, r.customerPhone, r.shippingAddress?.city, r.shippingAddress?.state, (r.totalPaise / 100).toFixed(2)]
            .map(csvEscape)
            .join(",")
        );
      }
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allRows.length} orders`);
    } catch (e) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">{meta ? `${meta.total} total` : "Loading…"}</p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline" className="rounded-full">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ q: qInput, page: 1 });
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search order #, email, phone, name" className="pl-9" />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full">Search</Button>
        </form>
        <Select value={status ?? "all"} onValueChange={(v) => updateParams({ status: v === "all" ? undefined : v, page: 1 })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Order status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No orders match.</td></tr>
              ) : (
                rows.map((o) => (
                  <tr key={o._id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o._id}`} className="font-medium text-primary hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.shippingAddress?.city}, {o.shippingAddress?.state}</td>
                    <td className="px-4 py-3">{formatINRFromPaise(o.totalPaise)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-xs font-medium">{o.paymentStatus === "collected" ? "Collected" : o.paymentStatus === "paid" ? "Online Payment - Paid" : "Online Payment - Pending"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: Math.max(1, page - 1) })}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: page + 1 })}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
