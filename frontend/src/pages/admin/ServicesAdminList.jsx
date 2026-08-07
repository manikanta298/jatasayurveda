import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { listServicesAdmin, deleteService } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ServicesAdminList() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => listServicesAdmin({ limit: 100 }),
  });
  const services = data ?? [];

  const delMut = useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Services</h1>
          <p className="text-sm text-muted-foreground">Treatment programs shown across the site.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/admin/services/new">
            <Plus className="h-4 w-4" /> New service
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Sort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && services.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No services yet.</td></tr>
            )}
            {services.map((s) => (
              <tr key={s._id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.bannerImageUrl ? (
                      <img src={s.bannerImageUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">/{s.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === "published" ? "default" : "secondary"}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">{s.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/admin/services/${s._id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${s.name}"?`)) delMut.mutate(s._id);
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
