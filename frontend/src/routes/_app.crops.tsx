import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCrops, type Crop } from "@/lib/crops";
import { PageHeader, EmptyState, formatDate } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/crops")({
  head: () => ({ meta: [{ title: "Crops — FarmLedger" }] }),
  component: CropsPage,
});

const STATUSES = ["planted", "growing", "flowering", "ready", "harvested", "failed"];

const EMPTY: Partial<Crop> = { status: "planted" };

function statusVariant(s?: string | null) {
  if (s === "harvested") return "default";
  if (s === "failed") return "destructive";
  return "secondary";
}

function CropsPage() {
  const qc = useQueryClient();
  const { data: crops, isLoading } = useCrops();
  const [editing, setEditing] = useState<Partial<Crop> | null>(null);

  const save = useMutation({
    mutationFn: async (c: Partial<Crop>) => {
      const payload = {
        name: c.name,
        variety: c.variety || null,
        field_name: c.field_name || null,
        area_size: c.area_size ? Number(c.area_size) : null,
        planting_date: c.planting_date || null,
        expected_harvest_date: c.expected_harvest_date || null,
        status: c.status || "planted",
        notes: c.notes || null,
      };
      if (c.id) {
        return api(`/api/crops/${c.id}`, { method: "PATCH", json: payload });
      }
      return api("/api/crops", { method: "POST", json: payload });
    },
    onSuccess: () => {
      toast.success("Crop saved");
      qc.invalidateQueries({ queryKey: ["crops"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const remove = useMutation({
    mutationFn: (id: Crop["id"]) => api(`/api/crops/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Crop deleted");
      qc.invalidateQueries({ queryKey: ["crops"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  return (
    <div>
      <PageHeader
        title="Crops"
        description="Register and track every crop you plant."
        actions={
          <Dialog open={!!editing} onOpenChange={(o) => setEditing(o ? (editing ?? EMPTY) : null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(EMPTY)}>
                <Plus className="mr-1 size-4" /> New crop
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing?.id ? "Edit crop" : "Register new crop"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editing) return;
                  save.mutate(editing);
                }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label="Name" required>
                  <Input
                    required
                    value={editing?.name ?? ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </Field>
                <Field label="Variety">
                  <Input
                    value={editing?.variety ?? ""}
                    onChange={(e) => setEditing({ ...editing, variety: e.target.value })}
                  />
                </Field>
                <Field label="Field name">
                  <Input
                    value={editing?.field_name ?? ""}
                    onChange={(e) => setEditing({ ...editing, field_name: e.target.value })}
                  />
                </Field>
                <Field label="Area size (acres/ha)">
                  <Input
                    type="number"
                    step="0.01"
                    value={editing?.area_size ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        area_size: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label="Planting date">
                  <Input
                    type="date"
                    value={editing?.planting_date?.slice(0, 10) ?? ""}
                    onChange={(e) => setEditing({ ...editing, planting_date: e.target.value })}
                  />
                </Field>
                <Field label="Expected harvest">
                  <Input
                    type="date"
                    value={editing?.expected_harvest_date?.slice(0, 10) ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, expected_harvest_date: e.target.value })
                    }
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={editing?.status ?? "planted"}
                    onValueChange={(v) => setEditing({ ...editing, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Notes">
                    <Textarea
                      rows={3}
                      value={editing?.notes ?? ""}
                      onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    />
                  </Field>
                </div>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading crops…</div>
      ) : !crops || crops.length === 0 ? (
        <EmptyState
          title="No crops yet"
          description="Register your first crop to start tracking activities, expenses, and harvests."
          action={
            <Button onClick={() => setEditing(EMPTY)}>
              <Plus className="mr-1 size-4" /> Register a crop
            </Button>
          }
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Planted</TableHead>
                <TableHead>Expected harvest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crops.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.variety && (
                      <div className="text-xs text-muted-foreground">{c.variety}</div>
                    )}
                  </TableCell>
                  <TableCell>{c.field_name ?? "—"}</TableCell>
                  <TableCell>{formatDate(c.planting_date)}</TableCell>
                  <TableCell>{formatDate(c.expected_harvest_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{c.status ?? "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete ${c.name}? This removes all its records.`))
                          remove.mutate(c.id);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
