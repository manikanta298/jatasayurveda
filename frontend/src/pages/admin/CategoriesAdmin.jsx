import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { listCategoriesAdmin, createCategory, updateCategory, deleteCategory } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function CategoriesAdmin() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listCategoriesAdmin({ limit: 200 }),
  });
  const categories = data ?? [];

  const [draft, setDraft] = useState({ name: "", slug: "", sortOrder: 0, isVisible: true });

  const createMut = useMutation({
    mutationFn: (v) => createCategory(v),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setDraft({ name: "", slug: "", sortOrder: 0, isVisible: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...v }) => updateCategory(id, v),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Product categories</h1>
        <p className="text-sm text-muted-foreground">Organize your storefront.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg">Add new</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto_auto]">
          <div>
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value, slug: s.slug || slugify(e.target.value) }))}
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={draft.slug} onChange={(e) => setDraft((s) => ({ ...s, slug: slugify(e.target.value) }))} />
          </div>
          <div>
            <Label>Sort</Label>
            <Input
              type="number"
              min={0}
              value={draft.sortOrder}
              onChange={(e) => setDraft((s) => ({ ...s, sortOrder: parseInt(e.target.value || "0") }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={draft.isVisible} onCheckedChange={(v) => setDraft((s) => ({ ...s, isVisible: v }))} />
              <span className="text-xs text-muted-foreground">Visible</span>
            </div>
          </div>
          <Button className="self-end rounded-full" disabled={!draft.name || !draft.slug || createMut.isPending} onClick={() => createMut.mutate(draft)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-right">Sort</th>
              <th className="px-4 py-3 text-left">Visible</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && categories.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No categories yet.</td></tr>
            )}
            {categories.map((c) => (
              <CategoryRow
                key={c._id}
                cat={c}
                onSave={(v) => updateMut.mutate(v)}
                onDelete={() => {
                  if (confirm(`Delete "${c.name}"?`)) delMut.mutate(c._id);
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryRow({ cat, onSave, onDelete }) {
  const [row, setRow] = useState({
    id: cat._id,
    name: cat.name,
    slug: cat.slug,
    sortOrder: cat.sortOrder,
    isVisible: cat.isVisible,
    description: cat.description,
  });
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <Input value={row.name} onChange={(e) => setRow((s) => ({ ...s, name: e.target.value }))} />
      </td>
      <td className="px-4 py-3">
        <Input value={row.slug} onChange={(e) => setRow((s) => ({ ...s, slug: slugify(e.target.value) }))} />
      </td>
      <td className="px-4 py-3 text-right">
        <Input type="number" min={0} value={row.sortOrder} onChange={(e) => setRow((s) => ({ ...s, sortOrder: parseInt(e.target.value || "0") }))} className="w-20" />
      </td>
      <td className="px-4 py-3">
        <Switch checked={row.isVisible} onCheckedChange={(v) => setRow((s) => ({ ...s, isVisible: v }))} />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onSave(row)}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
