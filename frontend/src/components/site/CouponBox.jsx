import { useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINRFromPaise } from "@/lib/format";

export default function CouponBox() {
  const { coupon, applyCoupon, removeCoupon, items } = useCart();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    const c = code.trim();
    if (!c || busy || items.length === 0) return;
    setBusy(true);
    try {
      const r = await applyCoupon(c);
      toast.success(`Coupon ${r.code} applied — you save ${formatINRFromPaise(r.discountPaise)}`);
      setCode("");
    } catch (err) {
      toast.error(err?.message || "Invalid coupon code");
    } finally {
      setBusy(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
        <span>Coupon <b>{coupon.code}</b> applied</span>
        <button type="button" onClick={removeCoupon} aria-label="Remove coupon" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
        placeholder="Coupon code"
        maxLength={30}
        autoComplete="off"
        className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button type="button" onClick={apply} disabled={busy || !code.trim()} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </button>
    </div>
  );
}
