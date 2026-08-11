import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { Section, Eyebrow } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/lib/customerAuth";

const emptyAddress = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };
const emptyLocation = { lat: null, lng: null, formattedAddress: "", placeId: "" };

export default function Profile() {
  const { customer, loading, updateProfile } = useCustomerAuth();
  const [name, setName] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [location, setLocation] = useState(emptyLocation);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name || "");
    const saved = Array.isArray(customer.addresses) ? customer.addresses : [];
    const fallback = customer.address?.line1 ? [{ id: "legacy-address", label: "Home", ...customer.address, isDefault: true }] : [];
    setAddresses((saved.length ? saved : fallback).slice(0, 3));

    setLocation({ ...emptyLocation, ...(customer.location || {}) });
  }, [customer]);

  function setAddressField(index, field) {
    return (e) => setAddresses((list) => list.map((a, i) => i === index ? { ...a, [field]: e.target.value } : a));
  }

  function addAddress() {
    if (addresses.length >= 3) {
      toast.error("You can save up to 3 addresses.");
      return;
    }
    setAddresses((list) => [
      ...list,
      { label: `Address ${list.length + 1}`, ...emptyAddress, isDefault: list.length === 0 },
    ]);
  }

  function removeAddress(index) {
    setAddresses((list) => {
      const next = list.filter((_, i) => i !== index);
      if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true };
      return next;
    });
  }

  function makeDefault(index) {
    setAddresses((list) => list.map((a, i) => ({ ...a, isDefault: i === index })));
  }

  // Uses the browser's own geolocation (no Google Maps API key required) to
  // grab the customer's coordinates, then reverse-geocodes them into a
  // readable label via OpenStreetMap's free Nominatim service, which needs
  // no API key either. Google Maps is still used to *display* the pin (see
  // the embed below), since a plain "output=embed" map URL doesn't require
  // a billed API key.
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location isn't supported in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let formattedAddress = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          formattedAddress = data?.display_name || "";
        } catch {
          // Reverse geocoding is best-effort — the raw coordinates are still saved either way.
        }
        setLocation({ lat: latitude, lng: longitude, formattedAddress, placeId: "" });
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Check your browser's permission settings.");
      }
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, addresses, location });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Section className="py-20">
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Section>
    );
  }

  if (!customer) {
    return (
      <Section className="py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
          <h1 className="font-display text-2xl text-foreground">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in from the account menu in the top navigation to manage your details.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </Section>
    );
  }

  const hasPin = Number.isFinite(location.lat) && Number.isFinite(location.lng);
  const mapSrc = hasPin ? `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed` : null;

  return (
    <Section className="py-16">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">My profile</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Keep your contact details, delivery address, and saved location up to date.
      </p>

      <form onSubmit={handleSave} className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <div>
            <h2 className="font-display text-xl text-foreground">Account details</h2>
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Full name</Label>
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={customer.email} disabled />
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-foreground">Saved delivery addresses</h2>
                <p className="mt-1 text-sm text-muted-foreground">Save up to 3 addresses. Your default address is preselected at checkout.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={addAddress} disabled={addresses.length >= 3}>
                Add address ({addresses.length}/3)
              </Button>
            </div>

            <div className="mt-4 space-y-5">
              {addresses.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                  No saved addresses yet. Add your first delivery address.
                </div>
              )}
              {addresses.map((a, index) => (
                <div key={a.id || index} className="rounded-2xl border border-border bg-background p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <Input
                      value={a.label || ""}
                      onChange={setAddressField(index, "label")}
                      placeholder="Address label (Home, Work...)"
                      className="max-w-[220px]"
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant={a.isDefault ? "secondary" : "outline"} size="sm" className="rounded-full" onClick={() => makeDefault(index)}>
                        {a.isDefault ? "Default" : "Make default"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="rounded-full text-destructive hover:text-destructive" onClick={() => removeAddress(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Address line 1</Label>
                      <Input value={a.line1 || ""} onChange={setAddressField(index, "line1")} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Address line 2</Label>
                      <Input value={a.line2 || ""} onChange={setAddressField(index, "line2")} />
                    </div>
                    <div className="space-y-1.5"><Label>City</Label><Input value={a.city || ""} onChange={setAddressField(index, "city")} /></div>
                    <div className="space-y-1.5"><Label>State</Label><Input value={a.state || ""} onChange={setAddressField(index, "state")} /></div>
                    <div className="space-y-1.5"><Label>Postal code</Label><Input value={a.postalCode || ""} onChange={setAddressField(index, "postalCode")} /></div>
                    <div className="space-y-1.5"><Label>Country</Label><Input value={a.country || "India"} onChange={setAddressField(index, "country")} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full rounded-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground">Saved location</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={locating}
              onClick={useCurrentLocation}
            >
              {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
              Use my location
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Pin your exact location so deliveries reach you faster.
          </p>

          {hasPin ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-border">
                <iframe
                  title="Saved location"
                  src={mapSrc}
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{location.formattedAddress || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}</span>
              </div>
            </>
          ) : (
            <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              No location saved yet
            </div>
          )}
        </div>
      </form>
    </Section>
  );
}
