import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listProductsAdmin, deleteProduct } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINRFromPaise } from "@/lib/format";

export default function ProductsAdminList() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listProductsAdmin({ limit: 100 }),
  });
  const products = data ?? [];

  const delMut = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your storefront catalog.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/admin/products/new">
            <Plus className="h-4 w-4" /> New product
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No products yet.</td></tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.featuredImageUrl ? (
                      <img src={p.featuredImageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.categoryLabel ?? "—"}</td>
                <td className="px-4 py-3 text-right">{formatINRFromPaise(p.discountPricePaise ?? p.pricePaise)}</td>
                <td className="px-4 py-3 text-right">{p.stockQuantity}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/admin/products/${p._id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) delMut.mutate(p._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
