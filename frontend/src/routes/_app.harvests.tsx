import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCrops } from "@/lib/crops";
import { PageHeader, EmptyState, formatDate, formatMoney } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CropSelect } from "@/components/crop-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/harvests")({
  head: () => ({ meta: [{ title: "Harvests — FarmLedger" }] }),
  component: HarvestsPage,
});

type Harvest = {
  id: number | string;
  crop_id: number | string;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  harvest_date: string;
  buyer?: string | null;
};

const EMPTY: Partial<Harvest> = { unit: "kg" };

function HarvestsPage() {
  const qc = useQueryClient();
  const { data: crops } = useCrops();
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Harvest> | null>(null);

  const query = useQuery({
    queryKey: ["harvests", filter],
    queryFn: () =>
      api<Harvest[]>(`/api/harvests${filter !== "all" ? `?crop_id=${filter}` : ""}`),
  });

  const save = useMutation({
    mutationFn: async (h: Partial<Harvest>) => {
      const payload = {
        crop_id: h.crop_id ? Number(h.crop_id) : undefined,
        quantity: Number(h.quantity || 0),
        unit: h.unit || "kg",
        unit_price: Number(h.unit_price || 0),
        harvest_date: h.harvest_date || new Date().toISOString().slice(0, 10),
        buyer: h.buyer || null,
      };
      if (h.id) return api(`/api/harvests/${h.id}`, { method: "PATCH", json: payload });
      return api("/api/harvests", { method: "POST", json: payload });
    },
    onSuccess: () => {
      toast.success("Harvest saved");
      qc.invalidateQueries({ queryKey: ["harvests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["profit"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: Harvest["id"]) => api(`/api/harvests/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["harvests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const cropName = (id: Harvest["crop_id"]) =>
    crops?.find((c) => String(c.id) === String(id))?.name ?? `#${id}`;
  const revenue = (query.data ?? []).reduce(
    (s, h) => s + Number(h.quantity || 0) * Number(h.unit_price || 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Harvests"
        description="Record what you harvested and what it sold for."
        actions={
          <div className="flex gap-2">
            <div className="w-48">
              <CropSelect crops={crops} value={filter} onChange={setFilter} allowAll />
            </div>
            <Dialog open={!!editing} onOpenChange={(o) => setEditing(o ? (editing ?? EMPTY) : null)}>
              <DialogTrigger asChild>
                <Button
                  onClick={() =>
                    setEditing({ ...EMPTY, crop_id: filter !== "all" ? filter : undefined })
                  }
                  disabled={!crops || crops.length === 0}
                >
                  <Plus className="mr-1 size-4" /> New harvest
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing?.id ? "Edit harvest" : "Record harvest"}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editing?.crop_id) {
                      toast.error("Select a crop");
                      return;
                    }
                    save.mutate(editing);
                  }}
                  className="grid gap-4"
                >
                  <div className="space-y-1.5">
                    <Label>Crop *</Label>
                    <CropSelect
                      crops={crops}
                      value={editing?.crop_id ? String(editing.crop_id) : ""}
                      onChange={(v) => setEditing({ ...editing, crop_id: v })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={editing?.quantity ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, quantity: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Input
                        value={editing?.unit ?? "kg"}
                        onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Unit price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={editing?.unit_price ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, unit_price: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Harvest date *</Label>
                      <Input
                        type="date"
                        required
                        value={editing?.harvest_date?.slice(0, 10) ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, harvest_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Buyer</Label>
                      <Input
                        value={editing?.buyer ?? ""}
                        onChange={(e) => setEditing({ ...editing, buyer: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={save.isPending}>
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {!query.data || query.data.length === 0 ? (
        <EmptyState
          title="No harvests yet"
          description="Record your first harvest to see revenue and profit."
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((h) => {
                const rev = Number(h.quantity || 0) * Number(h.unit_price || 0);
                return (
                  <TableRow key={h.id}>
                    <TableCell>{formatDate(h.harvest_date)}</TableCell>
                    <TableCell className="font-medium">{cropName(h.crop_id)}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(h.quantity)} {h.unit}
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(h.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(rev)}</TableCell>
                    <TableCell className="text-muted-foreground">{h.buyer || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(h)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this harvest?")) remove.mutate(h.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  Total revenue
                </TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(revenue)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
