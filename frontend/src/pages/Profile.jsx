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
  const [address, setAddress] = useState(emptyAddress);
  const [location, setLocation] = useState(emptyLocation);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name || "");
    setAddress({ ...emptyAddress, ...(customer.address || {}) });
    setLocation({ ...emptyLocation, ...(customer.location || {}) });
  }, [customer]);

  function setAddressField(field) {
    return (e) => setAddress((a) => ({ ...a, [field]: e.target.value }));
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
      await updateProfile({ name, address, location });
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
            <h2 className="font-display text-xl text-foreground">Delivery address</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="addr-line1">Address line 1</Label>
                <Input id="addr-line1" value={address.line1} onChange={setAddressField("line1")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="addr-line2">Address line 2</Label>
                <Input id="addr-line2" value={address.line2} onChange={setAddressField("line2")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-city">City</Label>
                <Input id="addr-city" value={address.city} onChange={setAddressField("city")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-state">State</Label>
                <Input id="addr-state" value={address.state} onChange={setAddressField("state")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-postal">Postal code</Label>
                <Input id="addr-postal" value={address.postalCode} onChange={setAddressField("postalCode")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="addr-country">Country</Label>
                <Input id="addr-country" value={address.country} onChange={setAddressField("country")} />
              </div>
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
