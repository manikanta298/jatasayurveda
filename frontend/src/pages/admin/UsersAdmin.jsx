import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus, Download } from "lucide-react";
import { z } from "zod";
import { listAdminUsers, createAdminUser, updateAdminUser, getMe } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTime } from "@/lib/format";

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const ROLES = ["admin", "content_manager", "product_manager", "order_manager", "marketing_manager"];
const ROLE_LABELS = {
  admin: "Admin",
  content_manager: "Content Manager",
  product_manager: "Product Manager",
  order_manager: "Order Manager",
  marketing_manager: "Marketing Manager",
};

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "At least 8 characters"),
});

// Note: unlike the original (which assigned roles to an existing Supabase
// self-signup account by email), this backend has no public registration —
// this form directly creates the staff account. See MIGRATION_PLAN.md, Phase 3.
export default function UsersAdmin() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState(["content_manager"]);
  const [confirming, setConfirming] = useState(null);

  const q = useQuery({ queryKey: ["admin-users"], queryFn: listAdminUsers, staleTime: 15_000 });
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 60_000 });

  const addMut = useMutation({
    mutationFn: (v) => createAdminUser(v),
    onSuccess: () => {
      toast.success("Staff account created");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (id) => updateAdminUser(id, { roles: [] }),
    onSuccess: () => {
      toast.success("All roles removed");
      setConfirming(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e.message),
  });

  function submit(e) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    if (selected.length === 0) return toast.error("Pick at least one role");
    addMut.mutate({ email: parsed.data.email, password: parsed.data.password, roles: selected });
  }

  function toggle(role) {
    setSelected((s) => (s.includes(role) ? s.filter((r) => r !== role) : [...s, role]));
  }

  function handleExport() {
    const rows = q.data ?? [];
    if (rows.length === 0) {
      toast.error("No members to export");
      return;
    }
    const headers = ["email", "roles", "is_active", "created_at", "last_login_at"];
    const lines = [headers.join(",")];
    for (const m of rows) {
      lines.push(
        [m.email, (m.roles || []).join("|"), m.isActive ? "yes" : "no", m.createdAt, m.lastLoginAt ?? ""]
          .map(csvEscape)
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} users`);
  }

  const members = q.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Create staff accounts and grant or revoke their roles.</p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" className="mt-1" autoComplete="off" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Temporary password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="mt-1" autoComplete="new-password" />
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <label key={r} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-sm">
              <Checkbox checked={selected.includes(r)} onCheckedChange={() => toggle(r)} className="mt-0.5" />
              <span>
                <span className="block font-medium">{ROLE_LABELS[r]}</span>
                <span className="text-xs text-muted-foreground">{r}</span>
              </span>
            </label>
          ))}
        </div>
        <Button type="submit" disabled={addMut.isPending} className="mt-4 rounded-full">
          <UserPlus className="mr-2 h-4 w-4" />
          {addMut.isPending ? "Saving…" : "Create staff account"}
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-xl">Current members</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{members.length} total</span>
            <Button size="sm" variant="outline" onClick={handleExport} className="rounded-full">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
        {q.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : q.error ? (
          <div className="p-6 text-sm text-destructive">{q.error.message}</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No members yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const isSelf = me.data?.id === m.id;
              return (
              <li key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="truncate font-medium">{m.email}</span>
                    {isSelf && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">You</span>
                    )}
                    {!m.isActive && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {m.roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No roles</span>
                    ) : (
                      m.roles.map((r) => (
                        <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Since {formatDateTime(m.createdAt)}
                    {m.lastLoginAt ? ` · Last sign-in ${formatDateTime(m.lastLoginAt)}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {confirming === m.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)} className="rounded-full">Cancel</Button>
                      <Button size="sm" variant="destructive" disabled={revokeMut.isPending} onClick={() => revokeMut.mutate(m.id)} className="rounded-full">
                        Confirm remove all
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSelf}
                      onClick={() => setConfirming(m.id)}
                      className="rounded-full"
                      title={isSelf ? "You cannot revoke your own roles" : undefined}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Revoke all
                    </Button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
