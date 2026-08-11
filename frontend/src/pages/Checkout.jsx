import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Lock, ArrowRight, MapPin, Settings2 } from "lucide-react";
import { Section, Eyebrow } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/settings";
import { useCustomerAuth } from "@/lib/customerAuth";
import { AuthModal } from "@/components/site/AuthModal";
import { formatINRFromPaise } from "@/lib/format";
import { createOrder, verifyPayment, listPaymentMethods } from "@/lib/queries";

const schema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  customer_email: z.string().trim().email("Enter a valid email").max(255),
  customer_phone: z.string().trim().min(7, "Enter a valid phone").max(20),
  shipping_address_line1: z.string().trim().min(3, "Address is required").max(200),
  shipping_address_line2: z.string().trim().max(200).optional(),
  shipping_city: z.string().trim().min(2).max(80),
  shipping_state: z.string().trim().min(2).max(80),
  shipping_pincode: z.string().trim().regex(/^\d{4,10}$/, "Enter a valid pincode"),
  shipping_country: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional(),
});

const empty = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  shipping_address_line1: "",
  shipping_address_line2: "",
  shipping_city: "",
  shipping_state: "",
  shipping_pincode: "",
  shipping_country: "India",
  notes: "",
};

export default function Checkout() {
  const { items, subtotalPaise, shippingPaise, totalPaise, clear } = useCart();
  const { brand } = useSettings();
  const { customer, loading: authLoading } = useCustomerAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");


  // Ask the backend which gateways are actually configured right now, so we
  // never show an option (e.g. ICICI) that would just fail at checkout.
  useEffect(() => {
    listPaymentMethods()
      .then((list) => {
        setMethods(list);
        setPaymentMethod((current) => current || list[0]?.key || "");
      })
      .catch(() => setMethods([{ key: "razorpay", label: "Razorpay" }]));
  }, []);

  // Signed-in customers don't have to retype their contact details.
  useEffect(() => {
    if (!customer) return;
    const addresses = customer.addresses || [];
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
    setValues((v) => {
      const next = {
        ...v,
        customer_name: v.customer_name || customer.name || "",
        customer_email: v.customer_email || customer.email || "",
        customer_phone: v.customer_phone || customer.phone || "",
      };
      if (defaultAddress && !v.shipping_address_line1) {
        next.shipping_address_line1 = defaultAddress.line1 || "";
        next.shipping_address_line2 = defaultAddress.line2 || "";
        next.shipping_city = defaultAddress.city || "";
        next.shipping_state = defaultAddress.state || "";
        next.shipping_pincode = defaultAddress.postalCode || "";
        next.shipping_country = defaultAddress.country || "India";
        setSelectedAddressId(String(defaultAddress.id || ""));
      }
      return next;
    });
  }, [customer]);

  function applySavedAddress(address) {
    if (!address) return;
    setSelectedAddressId(String(address.id || ""));
    setValues((v) => ({
      ...v,
      shipping_address_line1: address.line1 || "",
      shipping_address_line2: address.line2 || "",
      shipping_city: address.city || "",
      shipping_state: address.state || "",
      shipping_pincode: address.postalCode || "",
      shipping_country: address.country || "India",
    }));
    setErrors({});
  }

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please review the highlighted fields.");
      return;
    }

    if (paymentMethod === "razorpay" && !window.Razorpay) {
      toast.error("Payment could not load. Please refresh and try again.");
      return;
    }

    setBusy(true);
    try {
      const order = await createOrder({
        customerName: parsed.data.customer_name,
        customerEmail: parsed.data.customer_email,
        customerPhone: parsed.data.customer_phone,
        shippingAddress: {
          line1: parsed.data.shipping_address_line1,
          line2: parsed.data.shipping_address_line2,
          city: parsed.data.shipping_city,
          state: parsed.data.shipping_state,
          pincode: parsed.data.shipping_pincode,
          country: parsed.data.shipping_country,
        },
        cartItems: items.map((l) => ({ productId: l.productId, quantity: l.qty })),
        notes: parsed.data.notes,
        paymentMethod,
      });

      const finish = async (verifyPayload) => {
        try {
          await verifyPayment({ paymentMethod, gatewayOrderId: order.gatewayOrderId, ...verifyPayload });
          clear();
          toast.success("Order placed successfully!");
          navigate(`/order/${order.orderNumber}`, { state: { email: parsed.data.customer_email } });
        } catch (err) {
          toast.error(
            err.message ||
              "We couldn't confirm your order. Contact support with your order number: " + order.orderNumber
          );
        } finally {
          setBusy(false);
        }
      };

      if (order.paymentMethod === "cod") {
        // Nothing further for the customer to do — confirm immediately.
        await finish({});
        return;
      }

      if (order.paymentMethod === "razorpay") {
        const razorpay = new window.Razorpay({
          key: order.gatewayConfig.keyId,
          amount: order.gatewayConfig.amount,
          currency: order.gatewayConfig.currency,
          order_id: order.gatewayOrderId,
          name: brand.name || "JATA Ayurveda",
          description: `Order ${order.orderNumber}`,
          prefill: {
            name: parsed.data.customer_name,
            email: parsed.data.customer_email,
            contact: parsed.data.customer_phone,
          },
          theme: { color: "#1B5E20" },
          handler: (response) =>
            finish({
              gatewayPaymentId: response.razorpay_payment_id,
              gatewaySignature: response.razorpay_signature,
            }),
          modal: { ondismiss: () => setBusy(false) },
        });
        razorpay.open();
        return;
      }

      if (order.paymentMethod === "icici") {
        // Hosted-page redirect flow: submit a signed form to ICICI's gateway
        // URL. Field names here match the generic adapter in
        // backend/services/payments/icici.provider.js — update both together
        // once ICICI's actual merchant integration kit specifies its real field names.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = order.gatewayConfig.redirectUrl;
        const fields = {
          merchantId: order.gatewayConfig.merchantId,
          requestHash: order.gatewayConfig.requestHash,
          amount: order.gatewayConfig.amount,
          currency: order.gatewayConfig.currency,
          orderNumber: order.orderNumber,
        };
        for (const [k, v] of Object.entries(fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      throw new Error(`Unsupported payment method: ${order.paymentMethod}`);
    } catch (err) {
      toast.error(err.message || "We couldn't place your order. Please try again.");
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <Section className="pt-14 pb-24 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      </Section>
    );
  }

  if (!customer) {
    return (
      <Section className="pt-14 pb-24 text-center">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">Sign in to check out</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Create an account or log in to continue — this lets us email your order updates and let you track past orders.
        </p>
        <Button
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Log in or sign up
        </Button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab="login" />
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section className="pt-14 pb-24 text-center">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="mt-4 font-display text-3xl text-foreground sm:text-4xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add a product before checking out.</p>
        <Button asChild className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/products">Browse products</Link>
        </Button>
      </Section>
    );
  }

  return (
    <Section className="pt-14 pb-24">
      <Eyebrow>Checkout</Eyebrow>
      <h1 className="mt-4 font-display text-4xl font-semibold text-foreground sm:text-5xl">Checkout</h1>
      <p className="mt-2 text-muted-foreground">We'll email your order confirmation to {customer.email}.</p>

      <form onSubmit={onSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-8">
          <Card title="Contact details">
            <Field id="customer_name" label="Full name" value={values.customer_name} onChange={set("customer_name")} error={errors.customer_name} autoComplete="name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="customer_email" label="Email" type="email" value={values.customer_email} onChange={set("customer_email")} error={errors.customer_email} autoComplete="email" />
              <Field id="customer_phone" label="Mobile" type="tel" value={values.customer_phone} onChange={set("customer_phone")} error={errors.customer_phone} autoComplete="tel" />
            </div>
          </Card>

          <Card title="Shipping address">
            {(customer.addresses || []).length > 0 && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Saved addresses</p>
                    <p className="text-xs text-muted-foreground">Your profile address is selected automatically.</p>
                  </div>
                  <Button asChild type="button" variant="outline" size="sm" className="rounded-full">
                    <Link to="/profile"><Settings2 className="mr-2 h-4 w-4" /> Manage up to 3</Link>
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(customer.addresses || []).map((a) => (
                    <button
                      key={a.id || a.label}
                      type="button"
                      onClick={() => applySavedAddress(a)}
                      className={`rounded-2xl border p-3 text-left transition ${selectedAddressId === String(a.id || "") ? "border-primary bg-background shadow-sm" : "border-border bg-background hover:border-primary/40"}`}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-primary" />{a.label}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.line1}, {a.city}, {a.state} {a.postalCode}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Field id="shipping_address_line1" label="Address line 1" value={values.shipping_address_line1} onChange={set("shipping_address_line1")} error={errors.shipping_address_line1} autoComplete="address-line1" />
            <Field id="shipping_address_line2" label="Address line 2 (optional)" value={values.shipping_address_line2 || ""} onChange={set("shipping_address_line2")} error={errors.shipping_address_line2} autoComplete="address-line2" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="shipping_city" label="City" value={values.shipping_city} onChange={set("shipping_city")} error={errors.shipping_city} autoComplete="address-level2" />
              <Field id="shipping_state" label="State" value={values.shipping_state} onChange={set("shipping_state")} error={errors.shipping_state} autoComplete="address-level1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="shipping_pincode" label="Pincode" value={values.shipping_pincode} onChange={set("shipping_pincode")} error={errors.shipping_pincode} autoComplete="postal-code" inputMode="numeric" />
              <Field id="shipping_country" label="Country" value={values.shipping_country} onChange={set("shipping_country")} error={errors.shipping_country} autoComplete="country-name" />
            </div>
          </Card>

          <Card title="Order notes (optional)">
            <div>
              <Label htmlFor="notes" className="text-sm text-foreground">Delivery instructions</Label>
              <Textarea
                id="notes"
                value={values.notes || ""}
                onChange={set("notes")}
                placeholder="e.g. Please call before delivery"
                className="mt-2 min-h-24 rounded-2xl border-border bg-background"
              />
            </div>
          </Card>

          <Card title="Payment method">
            {methods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading payment options…</p>
            ) : (
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                {methods.map((m) => (
                  <label
                    key={m.key}
                    htmlFor={`pm-${m.key}`}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={m.key} id={`pm-${m.key}`} />
                    <span className="text-foreground">{m.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          </Card>
        </div>

        <aside className="sticky top-24 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-2xl text-foreground">Order summary</h2>
          <ul className="divide-y divide-border/60">
            {items.map((l) => (
              <li key={l.productId} className="flex items-start gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{l.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {l.qty}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{formatINRFromPaise(l.unitPricePaise * l.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINRFromPaise(subtotalPaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shippingPaise === 0 ? "Free" : formatINRFromPaise(shippingPaise)}</dd></div>
          </dl>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-display text-lg text-foreground">Total</span>
            <span className="font-display text-2xl font-semibold text-primary">{formatINRFromPaise(totalPaise)}</span>
          </div>
          <Button type="submit" size="lg" disabled={busy || !paymentMethod} className="w-full rounded-full bg-primary py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {busy ? "Processing..." : "Place order"}
            {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
          <p className="text-xs text-muted-foreground">
            By placing the order you agree to our terms. Online payments are processed securely.
          </p>
        </aside>
      </form>
    </Section>
  );
}

function Card({ title, children }) {
  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-7">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ id, label, value, onChange, error, type = "text", autoComplete, inputMode }) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm text-foreground">{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={!!error}
        className="mt-2 h-11 rounded-full border-border bg-background px-4"
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
