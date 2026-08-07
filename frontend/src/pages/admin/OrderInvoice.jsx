import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAdminOrder } from "@/lib/queries";
import { formatINRFromPaise, formatDate } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logos/jata-logo.png";

export default function OrderInvoice() {
  const { id } = useParams();
  const { brand, contact, footer } = useSettings();
  const q = useQuery({ queryKey: ["admin-order", id], queryFn: () => getAdminOrder(id) });

  useEffect(() => {
    if (q.data) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [q.data]);

  if (q.isLoading) return <p className="p-8">Loading invoice…</p>;
  if (q.error) return <p className="p-8 text-destructive">{q.error.message}</p>;
  const o = q.data;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mx-auto max-w-3xl bg-white p-6 text-black print:p-0">
        <div className="no-print mb-4 flex justify-end gap-2">
          <Button onClick={() => window.print()} className="rounded-full">Print / Save PDF</Button>
        </div>

        <header className="flex items-start justify-between gap-4 border-b-2 border-black/10 pb-6">
          <div className="flex items-center gap-3">
            <img src={brand.logo_url || logo} alt="JATA" className="h-14 w-auto" />
            <div>
              <div className="text-xl font-semibold">{footer.note || brand.name}</div>
              <div className="text-xs text-neutral-600">{contact.address}</div>
              <div className="text-xs text-neutral-600">{contact.email} · {contact.phone}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold uppercase tracking-widest">Invoice</div>
            <div className="text-sm">#{o.orderNumber}</div>
            <div className="text-xs text-neutral-600">{formatDate(o.createdAt)}</div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Billed to</div>
            <div className="mt-1 font-medium">{o.customerName}</div>
            <div>{o.customerEmail}</div>
            <div>{o.customerPhone}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Ship to</div>
            <div className="mt-1">{o.shippingAddress?.line1}</div>
            {o.shippingAddress?.line2 && <div>{o.shippingAddress.line2}</div>}
            <div>{o.shippingAddress?.city}, {o.shippingAddress?.state} {o.shippingAddress?.pincode}</div>
            <div>{o.shippingAddress?.country}</div>
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b-2 border-black/20 text-left">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((it, i) => (
              <tr key={i} className="border-b border-black/10">
                <td className="py-2">{it.name}<div className="text-xs text-neutral-500">{it.slug}</div></td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{formatINRFromPaise(it.unitPricePaise)}</td>
                <td className="py-2 text-right">{formatINRFromPaise(it.unitPricePaise * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <Line label="Subtotal" value={formatINRFromPaise(o.subtotalPaise)} />
          <Line label="Shipping" value={formatINRFromPaise(o.shippingPaise)} />
          {o.discountPaise > 0 && <Line label="Discount" value={`-${formatINRFromPaise(o.discountPaise)}`} />}
          <div className="mt-1 flex items-center justify-between border-t-2 border-black/40 pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatINRFromPaise(o.totalPaise)}</span>
          </div>
          {o.paidAt && <div className="pt-2 text-xs text-emerald-700">Paid on {formatDate(o.paidAt)}</div>}
          {o.razorpayPaymentId && <div className="text-xs text-neutral-500">Ref: {o.razorpayPaymentId}</div>}
        </div>

        <footer className="mt-12 border-t border-black/10 pt-4 text-center text-xs text-neutral-500">
          Thank you for choosing {brand.name}. For questions, contact {contact.email}.
        </footer>
      </div>
    </>
  );
}

function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
