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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/expenses")({
  head: () => ({ meta: [{ title: "Expenses — FarmLedger" }] }),
  component: ExpensesPage,
});

type Expense = {
  id: number | string;
  crop_id: number | string;
  category: string;
  amount: number;
  expense_date: string;
  description?: string | null;
};

const CATEGORIES = [
  "seeds",
  "fertilizer",
  "pesticide",
  "labor",
  "transport",
  "irrigation",
  "equipment",
  "other",
];
const EMPTY: Partial<Expense> = { category: "fertilizer" };

function ExpensesPage() {
  const qc = useQueryClient();
  const { data: crops } = useCrops();
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Expense> | null>(null);

  const query = useQuery({
    queryKey: ["expenses", filter],
    queryFn: () =>
      api<Expense[]>(`/api/expenses${filter !== "all" ? `?crop_id=${filter}` : ""}`),
  });

  const save = useMutation({
    mutationFn: async (x: Partial<Expense>) => {
      const payload = {
        crop_id: x.crop_id ? Number(x.crop_id) : undefined,
        category: x.category,
        amount: Number(x.amount || 0),
        expense_date: x.expense_date || new Date().toISOString().slice(0, 10),
        description: x.description || null,
      };
      if (x.id) return api(`/api/expenses/${x.id}`, { method: "PATCH", json: payload });
      return api("/api/expenses", { method: "POST", json: payload });
    },
    onSuccess: () => {
      toast.success("Expense saved");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["profit"] });
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: Expense["id"]) => api(`/api/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const cropName = (id: Expense["crop_id"]) =>
    crops?.find((c) => String(c.id) === String(id))?.name ?? `#${id}`;
  const total = (query.data ?? []).reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track every shilling spent per crop."
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
                  <Plus className="mr-1 size-4" /> New expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing?.id ? "Edit expense" : "Record expense"}</DialogTitle>
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Category *</Label>
                      <Select
                        value={editing?.category ?? "fertilizer"}
                        onValueChange={(v) => setEditing({ ...editing, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={editing?.amount ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, amount: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      required
                      value={editing?.expense_date?.slice(0, 10) ?? ""}
                      onChange={(e) => setEditing({ ...editing, expense_date: e.target.value })}
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
          title="No expenses recorded"
          description="Record seeds, labor, fertilizer, transport and more."
        />
      ) : (
        <div className="rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{formatDate(x.expense_date)}</TableCell>
                  <TableCell className="font-medium">{cropName(x.crop_id)}</TableCell>
                  <TableCell className="capitalize">{x.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(x.amount)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {x.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(x)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Delete this expense?")) remove.mutate(x.id);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(total)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
