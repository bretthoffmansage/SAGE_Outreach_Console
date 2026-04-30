import { KeyRound, Lock, ShieldCheck, UserCog } from "lucide-react";
import { agents, auditEvents, integrations, users } from "@/lib/data/demo-data";
import { Card, Pill, Button } from "@/components/ui";

export function SettingsSection() {
  return (
    <div className="space-y-6">
      <div><Pill tone="gray">Admin settings</Pill><h2 className="mt-3 text-3xl font-bold text-[#172033]">Settings</h2><p className="mt-2 max-w-3xl text-[#6f7685]">Admin-safe view of users, roles, agent configuration, prompts, integration setup, security reminders, and audit logs.</p></div>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card><div className="flex items-center gap-2"><UserCog className="h-5 w-5 text-[#4f5f8f]" /><h3 className="text-xl font-bold text-[#172033]">Users and roles</h3></div><div className="mt-4 space-y-3">{users.map((user) => <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4" key={user.id}><p className="font-bold text-[#172033]">{user.name}</p><p className="text-sm text-[#6f7685]">{user.email}</p><div className="mt-2 flex flex-wrap gap-2">{user.roles.map((role) => <Pill key={role} tone="blue">{role}</Pill>)}</div></div>)}</div></Card>
        <Card><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h3 className="text-xl font-bold text-[#172033]">Security posture</h3></div><div className="mt-4 space-y-3 text-sm text-[#6f7685]">{["Clerk auth and role enforcement are scaffolded for live setup.", "API keys and external tokens must remain server-side only.", "Integration settings are admin-only surfaces.", "Agents may not bypass human approvals for risky actions."].map((item) => <div className="flex gap-2 rounded-2xl border border-[#eadfce] bg-white/70 p-3" key={item}><Lock className="mt-0.5 h-4 w-4 text-[#4f5f8f]" /> {item}</div>)}</div></Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card><h3 className="text-xl font-bold text-[#172033]">Agents and prompts</h3><div className="mt-4 grid gap-3">{agents.slice(0,5).map((agent) => <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4" key={agent.id}><Pill tone={agent.status === "needs_config" ? "amber" : "green"}>{agent.status.replace(/_/g, " ")}</Pill><p className="mt-2 font-bold text-[#172033]">{agent.name}</p><p className="text-sm text-[#6f7685]">{agent.model}</p></div>)}</div><div className="mt-4"><Button variant="secondary">View prompt config</Button></div></Card>
        <Card><h3 className="text-xl font-bold text-[#172033]">Audit log</h3><div className="mt-4 space-y-3">{auditEvents.map((event) => <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4" key={event.id}><p className="font-bold text-[#172033]">{event.actor} {event.action}</p><p className="text-sm text-[#6f7685]">{event.target}</p></div>)}</div></Card>
      </section>
      <Card><div className="flex gap-3"><KeyRound className="h-5 w-5 text-[#8a7357]" /><div><h3 className="font-bold text-[#172033]">Environment setup visibility</h3><p className="mt-2 text-sm leading-6 text-[#6f7685]">{integrations.length} integrations are documented with required env keys. This page never displays secret values and leaves live setup to deployment configuration.</p></div></div></Card>
    </div>
  );
}
