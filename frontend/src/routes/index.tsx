import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, LineChart, Wallet, Wheat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen gradient-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg gradient-primary shadow-elegant">
            <Sprout className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">FarmLedger</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <span className="size-1.5 rounded-full bg-success" />
              Smart Farm Management
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
              Your farm's digital record book — with profit built in.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Register crops, log activities, track expenses, record harvests, and see profit
              calculated automatically. No more notebooks, no more guesswork.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  Create free account <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Sprout, title: "Crops", desc: "Register and monitor every field." },
              { icon: Wallet, title: "Expenses", desc: "Seeds, labor, transport, chemicals." },
              { icon: Wheat, title: "Harvests", desc: "Quantity, price, buyer, date." },
              { icon: LineChart, title: "Profit", desc: "Revenue minus expenses, instantly." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-elegant"
              >
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </div>
                <div className="mt-4 font-display font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
