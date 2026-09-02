import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getApiBase, setApiBase } from "@/lib/api";
import { PageHeader } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — FarmLedger" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [url, setUrl] = useState(getApiBase());
  const [status, setStatus] = useState<string | null>(null);

  function save() {
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid URL");
      return;
    }
    setApiBase(url);
    toast.success("API URL updated");
  }

  async function testConnection() {
    setStatus("Checking…");
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/health`);
      if (res.ok) setStatus("Backend reachable ✓");
      else setStatus(`Backend responded ${res.status}`);
    } catch (e) {
      setStatus(`Not reachable: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Settings"
        description="Configure the connection to your farm backend."
      />

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Backend API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api">API base URL</Label>
            <Input
              id="api"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
            <p className="text-xs text-muted-foreground">
              Default is <code>http://127.0.0.1:8000</code>. If you deploy this app to HTTPS,
              your backend also needs to be reachable over HTTPS (browsers block mixed content
              and requests to localhost from HTTPS sites).
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={testConnection}>
              Test connection
            </Button>
          </div>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
