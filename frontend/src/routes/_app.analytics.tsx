import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { api, apiBlob, getApiBase, getToken } from "@/lib/api";
import { useCrops } from "@/lib/crops";
import { PageHeader, formatMoney } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CropSelect } from "@/components/crop-select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — FarmLedger" }] }),
  component: AnalyticsPage,
});

type Profit = {
  crop_id?: number | string | null;
  total_expenses: number;
  total_revenue: number;
  harvest_quantity?: number;
  profit: number;
};

function AnalyticsPage() {
  const { data: crops } = useCrops();
  const [scope, setScope] = useState<string>("all");

  const profit = useQuery({
    queryKey: ["profit", scope],
    queryFn: () =>
      api<Profit>(`/api/analytics/profit${scope !== "all" ? `?crop_id=${scope}` : ""}`),
  });

  async function downloadCsv() {
    try {
      const blob = await apiBlob("/api/reports/profit.csv");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "profit-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  }

  async function downloadCropReport() {
    if (scope === "all") {
      toast.error("Select a specific crop first");
      return;
    }
    try {
      const data = await api<unknown>(`/api/reports/crop/${scope}`);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crop-${scope}-report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report failed");
    }
  }

  const p = profit.data;
  const positive = (p?.profit ?? 0) >= 0;

  return (
    <div>
      <PageHeader
        title="Analytics & Reports"
        description="Profit calculations and downloadable reports."
        actions={
          <div className="flex flex-wrap gap-2">
            <div className="w-56">
              <CropSelect
                crops={crops}
                value={scope}
                onChange={setScope}
                allowAll
                placeholder="Scope"
              />
            </div>
            <Button variant="outline" onClick={downloadCsv}>
              <Download className="mr-1 size-4" /> Profit CSV
            </Button>
            <Button variant="outline" onClick={downloadCropReport} disabled={scope === "all"}>
              <Download className="mr-1 size-4" /> Crop report (JSON)
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-semibold">
              {formatMoney(p?.total_revenue)}
            </div>
            {p?.harvest_quantity != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatMoney(p.harvest_quantity)} units harvested
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-semibold">
              {formatMoney(p?.total_expenses)}
            </div>
          </CardContent>
        </Card>
        <Card className={`shadow-soft ${positive ? "" : "border-destructive"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {positive ? "Profit" : "Loss"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`font-display text-3xl font-semibold ${
                positive ? "text-success" : "text-destructive"
              }`}
            >
              {formatMoney(p?.profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <div>
            Base URL: <code className="rounded bg-muted px-1.5 py-0.5">{getApiBase()}</code>
          </div>
          <div>
            Auth token:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              {getToken() ? "Bearer …" : "not set"}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
