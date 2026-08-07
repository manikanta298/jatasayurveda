import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/queries";

// Note: unlike the original (which offered Supabase self-service signup),
// this backend has no public registration endpoint by design — staff
// accounts are provisioned by an admin via the Users section. See
// MIGRATION_PLAN.md, Phase 3 notes.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Signed in");
      navigate("/admin");
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
        <h1 className="font-display text-3xl text-foreground">Admin Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to manage orders, products and content.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full bg-primary">
            {busy ? "Please wait…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
