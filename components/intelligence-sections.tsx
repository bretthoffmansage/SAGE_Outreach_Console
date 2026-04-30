import { Bot, Braces, CheckCircle2, CircleDashed, GitBranch, PauseCircle, ShieldAlert } from "lucide-react";
import { agentRunSteps, agents, langGraphNodes } from "@/lib/data/demo-data";
import { Card, Pill, Button } from "@/components/ui";

function tone(status: string) {
  if (["completed", "complete", "ready", "demo"].includes(status)) return "green";
  if (["waiting_for_human", "human_pause", "needs_config"].includes(status)) return "amber";
  if (["failed", "blocked"].includes(status)) return "red";
  return "gray";
}

function IconFor({ status }: { status: string }) {
  if (status === "complete" || status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "human_pause" || status === "waiting_for_human") return <PauseCircle className="h-5 w-5 text-amber-600" />;
  return <CircleDashed className="h-5 w-5 text-[#8a7357]" />;
}

export function AgentRunsSection() {
  return (
    <div className="space-y-6">
      <div>
        <Pill tone="purple">Agent runs</Pill>
        <h2 className="mt-3 text-3xl font-bold text-[#172033]">Specialist agent visibility</h2>
        <p className="mt-2 max-w-3xl text-[#6f7685]">Inspect the roster and seeded structured outputs before live OpenAI, Claude, or LangGraph credentials are connected.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <div className="flex items-start justify-between gap-3"><Pill tone={tone(agent.status)}>{agent.status.replace(/_/g, " ")}</Pill><Bot className="h-5 w-5 text-[#4f5f8f]" /></div>
            <h3 className="mt-4 text-lg font-bold text-[#172033]">{agent.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6f7685]">{agent.purpose}</p>
            <p className="mt-3 text-sm font-semibold text-[#26324a]">Model: {agent.model}</p>
            <div className="mt-4 grid gap-2 text-xs text-[#6f7685]"><span>Inputs: {agent.inputs.join(", ")}</span><span>Outputs: {agent.outputs.join(", ")}</span></div>
          </Card>
        ))}
      </section>
      <section className="grid gap-4">
        {agentRunSteps.map((step) => (
          <Card key={step.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2"><Pill tone={tone(step.status)}>{step.status.replace(/_/g, " ")}</Pill><Pill tone={step.riskLevel === "green" ? "green" : step.riskLevel === "yellow" ? "amber" : "red"}>{step.riskLevel} risk</Pill></div>
                <h3 className="mt-3 text-xl font-bold text-[#172033]">{step.agentName}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f7685]">{step.summary}</p>
                <p className="mt-3 text-sm font-semibold text-[#4f5f8f]">Confidence {Math.round(step.confidence * 100)}% · Approval owner: {step.approvalOwner}</p>
              </div>
              <div className="min-w-72 rounded-2xl border border-[#eadfce] bg-[#fffaf2] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Braces className="h-4 w-4" /> structured_outputs</div>
                <pre className="mt-3 overflow-auto text-xs leading-5 text-[#6f7685]">{JSON.stringify(step.structuredOutputs, null, 2)}</pre>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function LangGraphSection() {
  return (
    <div className="space-y-6">
      <div>
        <Pill tone="purple">LangGraph map</Pill>
        <h2 className="mt-3 text-3xl font-bold text-[#172033]">Campaign agent workflow</h2>
        <p className="mt-2 max-w-3xl text-[#6f7685]">A non-technical map of the campaign machine, showing completed nodes, pending work, and the Bari human-approval pause.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {langGraphNodes.map((node) => (
          <Card key={node.id}>
            <div className="flex items-center justify-between gap-3"><Pill tone={tone(node.status)}>{node.status.replace(/_/g, " ")}</Pill><IconFor status={node.status} /></div>
            <h3 className="mt-4 text-lg font-bold text-[#172033]">{node.label}</h3>
            <p className="mt-2 text-sm text-[#6f7685]">Next: {node.next.length ? node.next.join(", ") : "Workflow complete"}</p>
          </Card>
        ))}
      </div>
      <Card className="bg-[#172033] text-white">
        <div className="flex gap-3"><ShieldAlert className="h-5 w-5 text-[#f1d9ad]" /><div><h3 className="font-bold">Human-in-the-loop pause</h3><p className="mt-2 text-sm leading-6 text-slate-300">The Bari Voice node is intentionally paused for human copy authority. Later packages can connect approval outcomes back into workflow state.</p></div></div>
      </Card>
    </div>
  );
}

export function IntelligenceRouteSection({ slug }: { slug?: string[] }) {
  if (slug?.[1] === "langgraph") return <LangGraphSection />;
  if (slug?.[1] === "agent-runs") return <AgentRunsSection />;
  return (
    <div className="space-y-6">
      <div><Pill tone="purple">Intelligence</Pill><h2 className="mt-3 text-3xl font-bold text-[#172033]">Intelligence hub</h2><p className="mt-2 text-[#6f7685]">Choose Agent Runs or LangGraph Map to inspect current workflow intelligence.</p></div>
      <div className="grid gap-4 md:grid-cols-2"><Card><GitBranch className="h-5 w-5 text-[#4f5f8f]" /><h3 className="mt-3 text-lg font-bold">LangGraph Map</h3><p className="mt-2 text-sm text-[#6f7685]">Visual node/edge workflow state.</p><Button>Open workflow</Button></Card><Card><Bot className="h-5 w-5 text-[#4f5f8f]" /><h3 className="mt-3 text-lg font-bold">Agent Runs</h3><p className="mt-2 text-sm text-[#6f7685]">Structured outputs and roster.</p><Button>Open runs</Button></Card></div>
    </div>
  );
}
