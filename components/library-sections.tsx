import { AlertTriangle, BookOpen, Filter, Plus, Search, Sparkles } from "lucide-react";
import { libraryItems, learningInsights } from "@/lib/data/demo-data";
import { Card, Pill, Button } from "@/components/ui";

const libraryConfig: Record<string, { title: string; type?: string | string[]; summary: string; tone: string }> = {
  offers: { title: "Offers & Lead Magnets", type: ["offer", "lead_magnet"], summary: "Approved, proposed, active, paused, and performance-aware marketing offers. Agents must not invent new offers silently.", tone: "blue" },
  email: { title: "Email Library", type: "email", summary: "Historical emails and Bari voice examples with source authority ratings like Gold, Silver, Bronze, Rejected, and Needs Review.", tone: "purple" },
  "voice-rules": { title: "Bari Voice Rules", type: "voice_rule", summary: "Editable founder-voice rules, including blocking terminology guidance and do-not-use patterns.", tone: "amber" },
  signoffs: { title: "Sign-off Library", type: "signoff", summary: "Approved sign-off families and context rules agents may select from safely.", tone: "green" },
  audiences: { title: "Audience Library", type: "audience", summary: "Audience definitions, Keap mappings, exclusions, allowed offers, and performance notes.", tone: "blue" },
  compliance: { title: "Compliance Rules", type: "compliance_rule", summary: "Risky or banned claims, safer wording guidance, severity, and Blue-review requirements.", tone: "red" },
  learning: { title: "Learning Library", type: "learning", summary: "Reviewable insights from Bari edits, Blue decisions, replies, performance, and agent evaluations.", tone: "purple" },
};

function statusTone(status: string) {
  if (["active", "approved", "gold"].includes(status)) return "green";
  if (["needs_blue_approval", "candidate", "blocking"].includes(status)) return status === "blocking" ? "red" : "amber";
  return "gray";
}

export function LibraryRouteSection({ slug }: { slug?: string[] }) {
  const key = slug?.[1] ?? "offers";
  const config = libraryConfig[key] ?? libraryConfig.offers;
  const records = libraryItems.filter((item) => Array.isArray(config.type) ? config.type.includes(item.type) : item.type === config.type);
  const sageRule = libraryItems.find((item) => item.id === "rule_sage_caps");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Pill tone={config.tone}>{config.title}</Pill>
          <h2 className="mt-3 text-3xl font-bold text-[#172033]">{config.title}</h2>
          <p className="mt-2 max-w-3xl text-[#6f7685]">{config.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button><Plus className="mr-2 h-4 w-4" /> Add record</Button>
          <Button variant="secondary"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button variant="secondary"><Search className="mr-2 h-4 w-4" /> Search</Button>
        </div>
      </div>

      {key === "voice-rules" && sageRule && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex gap-3 text-red-900">
            <AlertTriangle className="mt-1 h-5 w-5" />
            <div>
              <h3 className="font-bold">Default blocking terminology rule</h3>
              <p className="mt-1 text-sm leading-6">{sageRule.name}: {sageRule.summary}</p>
            </div>
          </div>
        </Card>
      )}

      {key === "learning" && (
        <Card className="bg-[#172033] text-white">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-[#f1d9ad]" />
            <div>
              <h3 className="font-bold">Learning candidates require review</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Insights from Bari edits, Blue decisions, campaign performance, HelpDesk replies, and agents stay as candidates until approved.</p>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {records.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <Pill tone={statusTone(item.status)}>{item.status.replace(/_/g, " ")}</Pill>
              <BookOpen className="h-5 w-5 text-[#647094]" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#172033]">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6f7685]">{item.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">{item.tags.map((tag) => <span className="rounded-full bg-[#f4ecdf] px-2.5 py-1 text-xs font-semibold text-[#8a7357]" key={tag}>{tag}</span>)}</div>
          </Card>
        ))}
      </section>

      {key === "learning" && (
        <section className="grid gap-4 md:grid-cols-2">
          {learningInsights.map((insight) => (
            <Card key={insight.id}>
              <Pill tone={statusTone(insight.status)}>{insight.status}</Pill>
              <h3 className="mt-4 text-lg font-bold text-[#172033]">{insight.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#6f7685]">{insight.summary}</p>
              <p className="mt-4 text-sm font-semibold text-[#4f5f8f]">Confidence {Math.round(insight.confidence * 100)}%</p>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
