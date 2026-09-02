import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCrops } from "@/lib/crops";
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
import { CropSelect } from "@/components/crop-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/activities")({
  head: () => ({ meta: [{ title: "Activities — FarmLedger" }] }),
  component: ActivitiesPage,
});

type Activity = {
  id: number | string;
  crop_id: number | string;
  activity_type: string;
  activity_date: string;
  description?: string | null;
};

const TYPES = ["planting", "watering", "weeding", "spraying", "fertilizing", "pruning", "other"];
const EMPTY: Partial<Activity> = { activity_type: "watering" };

function ActivitiesPage() {
  const qc = useQueryClient();
  const { data: crops } = useCrops();
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Activity> | null>(null);

  const query = useQuery({
    queryKey: ["activities", filter],
    queryFn: () =>
      api<Activity[]>(
        `/api/activities${filter !== "all" ? `?crop_id=${filter}` : ""}`,
      ),
  });

  const save = useMutation({
    mutationFn: async (a: Partial<Activity>) => {
      const payload = {
        crop_id: a.crop_id ? Number(a.crop_id) : undefined,
        activity_type: a.activity_type,
        activity_date: a.activity_date || new Date().toISOString().slice(0, 10),
        description: a.description || null,
      };
      if (a.id) {
        return api(`/api/activities/${a.id}`, { method: "PATCH", json: payload });
      }
      return api("/api/activities", { method: "POST", json: payload });
    },
    onSuccess: () => {
      toast.success("Activity saved");
      qc.invalidateQueries({ queryKey: ["activities"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: Activity["id"]) => api(`/api/activities/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const cropName = (id: Activity["crop_id"]) =>
    crops?.find((c) => String(c.id) === String(id))?.name ?? `#${id}`;

  return (
    <div>
      <PageHeader
        title="Activities"
        description="Log every operation you perform on your crops."
        actions={
          <div className="flex gap-2">
            <div className="w-48">
              <CropSelect
                crops={crops}
                value={filter}
                onChange={setFilter}
                allowAll
                placeholder="Filter by crop"
              />
            </div>
            <Dialog open={!!editing} onOpenChange={(o) => setEditing(o ? (editing ?? EMPTY) : null)}>
              <DialogTrigger asChild>
                <Button
                  onClick={() =>
                    setEditing({ ...EMPTY, crop_id: filter !== "all" ? filter : undefined })
                  }
                  disabled={!crops || crops.length === 0}
                >
                  <Plus className="mr-1 size-4" /> New activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editing?.id ? "Edit activity" : "Log new activity"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editing) return;
                    if (!editing.crop_id) {
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
                  <div className="space-y-1.5">
                    <Label>Activity type *</Label>
                    <Select
                      value={editing?.activity_type ?? "watering"}
                      onValueChange={(v) => setEditing({ ...editing, activity_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      required
                      value={editing?.activity_date?.slice(0, 10) ?? ""}
                      onChange={(e) => setEditing({ ...editing, activity_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={editing?.description ?? ""}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
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
          title="No activities yet"
          description={
            crops && crops.length > 0
              ? "Log your first activity to keep a complete crop timeline."
              : "Register a crop first before logging activities."
          }
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDate(a.activity_date)}</TableCell>
                  <TableCell className="font-medium">{cropName(a.crop_id)}</TableCell>
                  <TableCell className="capitalize">{a.activity_type}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {a.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(a)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Delete this activity?")) remove.mutate(a.id);
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
