import { Download, KeyRound, PlugZap, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { campaigns, integrations } from "@/lib/data/demo-data";
import { Card, Pill, Button } from "@/components/ui";

function tone(status: string) {
  if (status === "connected") return "green";
  if (status === "manual_mode") return "blue";
  if (status === "missing_credentials") return "amber";
  if (status === "error") return "red";
  return "gray";
}

export function IntegrationsSection() {
  return (
    <div className="space-y-6">
      <div><Pill tone="blue">Integration settings</Pill><h2 className="mt-3 text-3xl font-bold text-[#172033]">Integrations</h2><p className="mt-2 max-w-3xl text-[#6f7685]">Connection cards expose setup status without showing secret values. Missing credentials keep the app in safe demo/manual mode.</p></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <div className="flex items-start justify-between gap-3"><Pill tone={tone(integration.status)}>{integration.status.replace(/_/g, " ")}</Pill><PlugZap className="h-5 w-5 text-[#4f5f8f]" /></div>
            <h3 className="mt-4 text-lg font-bold text-[#172033]">{integration.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6f7685]">{integration.purpose}</p>
            <div className="mt-4 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#172033]"><KeyRound className="h-4 w-4" /> Required env keys</div><p className="mt-2 text-xs leading-5 text-[#6f7685]">{integration.envKeys.join(", ")}</p></div>
            <p className="mt-4 text-sm font-semibold text-[#4f5f8f]">Fallback: {integration.fallback}</p>
            <div className="mt-4 flex gap-2"><Button variant="secondary">Test</Button><Button variant="secondary">Sync</Button></div>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function KeapOperationsSection() {
  const ready = campaigns.filter((campaign) => campaign.status === "ready_for_keap");
  const checklist = ["Campaign brief complete", "Copy approved", "Bari approval complete if required", "Blue approval complete if required", "Internal approval complete", "Offer active/approved", "Audience confirmed", "Compliance blockers cleared", "Keap handoff/export prepared"];
  return (
    <div className="space-y-6">
      <div><Pill tone="green">Keap/Zapier operations</Pill><h2 className="mt-3 text-3xl font-bold text-[#172033]">Keap Sync</h2><p className="mt-2 max-w-3xl text-[#6f7685]">Hybrid execution shell for Keap tag/segment readiness, Zapier handoffs, and manual export while credentials are disconnected.</p></div>
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h3 className="text-xl font-bold text-[#172033]">Ready-for-Keap campaigns</h3>
          <div className="mt-5 grid gap-3">
            {ready.map((campaign) => <div key={campaign.id} className="rounded-2xl border border-[#eadfce] bg-white/70 p-4"><Pill tone="green">ready for keap</Pill><h4 className="mt-3 font-bold text-[#172033]">{campaign.name}</h4><p className="mt-1 text-sm text-[#6f7685]">{campaign.nextAction}</p></div>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button><Download className="mr-2 h-4 w-4" /> Manual export</Button><Button variant="secondary"><Send className="mr-2 h-4 w-4" /> Zapier webhook shell</Button></div>
        </Card>
        <Card>
          <h3 className="text-xl font-bold text-[#172033]">Send prep checklist</h3>
          <div className="mt-4 grid gap-2">{checklist.map((item, index) => <div className="flex items-center gap-2 rounded-2xl border border-[#eadfce] bg-white/70 p-3 text-sm" key={item}>{index < 7 ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <RefreshCw className="h-4 w-4 text-[#8a7357]" />} {item}</div>)}</div>
        </Card>
      </section>
    </div>
  );
}

export function OperationsRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "integrations") return <IntegrationsSection />;
  return <KeapOperationsSection />;
}
