import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Wallet, Wheat, LineChart, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, formatMoney } from "@/lib/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — FarmLedger" }] }),
  component: DashboardPage,
});

type Dashboard = {
  total_crops: number;
  active_crops: number;
  harvested_crops: number;
  total_expenses: number;
  total_revenue: number;
  total_profit: number;
  total_harvest_quantity: number;
};

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dashboard>("/api/analytics/dashboard"),
  });

  const stats = [
    {
      label: "Total crops",
      value: data?.total_crops ?? 0,
      icon: Sprout,
      hint: `${data?.active_crops ?? 0} active · ${data?.harvested_crops ?? 0} harvested`,
    },
    {
      label: "Total revenue",
      value: formatMoney(data?.total_revenue),
      icon: Wheat,
      hint: `${formatMoney(data?.total_harvest_quantity)} units harvested`,
    },
    {
      label: "Total expenses",
      value: formatMoney(data?.total_expenses),
      icon: Wallet,
    },
    {
      label: "Total profit",
      value: formatMoney(data?.total_profit),
      icon: (data?.total_profit ?? 0) >= 0 ? TrendingUp : TrendingDown,
      positive: (data?.total_profit ?? 0) >= 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Farm dashboard"
        description="A live summary of your farm records and profit."
        actions={
          <Button asChild>
            <Link to="/crops">Manage crops</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon
                className={`size-4 ${
                  "positive" in s
                    ? s.positive
                      ? "text-success"
                      : "text-destructive"
                    : "text-muted-foreground"
                }`}
              />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div
                  className={`font-display text-3xl font-semibold ${
                    "positive" in s && !s.positive ? "text-destructive" : ""
                  }`}
                >
                  {s.value}
                </div>
              )}
              {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/crops">Register a new crop</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/expenses">Record an expense</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/harvests">Record a harvest</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/activities">Log an activity</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profit at a glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-accent p-4">
                <div className="text-xs text-muted-foreground">Revenue</div>
                <div className="mt-1 font-display text-xl font-semibold">
                  {formatMoney(data?.total_revenue)}
                </div>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <div className="text-xs text-muted-foreground">Expenses</div>
                <div className="mt-1 font-display text-xl font-semibold">
                  {formatMoney(data?.total_expenses)}
                </div>
              </div>
              <div className="rounded-lg gradient-primary p-4 text-primary-foreground">
                <div className="text-xs opacity-80">Profit</div>
                <div className="mt-1 font-display text-xl font-semibold">
                  {formatMoney(data?.total_profit)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              See per-crop breakdowns in{" "}
              <Link to="/analytics" className="underline">
                Analytics
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
