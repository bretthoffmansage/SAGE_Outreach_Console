import { KeyRound, Lock, ShieldCheck, UserCog } from "lucide-react";
import { agents, auditEvents, integrations, users } from "@/lib/data/demo-data";
import { ConsoleTable, ControlPanel, SectionHeader, StatusBadge, Td, Th, TableHead } from "@/components/ui";

function titleCaseSnake(s: string): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeUserRole(role: string): string {
  const map: Record<string, string> = {
    admin: "Admin",
    marketing_operator: "Marketing Operator",
    bari: "Bari / Founder Voice",
    blue: "Blue / Strategy Review",
  };
  return map[role] ?? titleCaseSnake(role);
}

function humanizeAgentStatus(status: string): string {
  const k = status.toLowerCase();
  const map: Record<string, string> = {
    demo: "Demo",
    needs_config: "Needs config",
    needs_configuration: "Needs configuration",
  };
  return map[k] ?? titleCaseSnake(status);
}

export function SettingsSection() {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Console settings"
        title="Settings"
        description="Branding, roles, approval posture, demo data mode, agent defaults, and audit visibility."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-slate-100">Users + roles preview</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Demo role examples. Live Clerk/Convex user management is not wired from this page unless configured.</p>
          <ConsoleTable className="mt-4">
            <TableHead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Roles</Th>
              </tr>
            </TableHead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.roles.map((r) => humanizeUserRole(r)).join(", ")}</Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
        </ControlPanel>

        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <p className="text-sm font-semibold text-slate-100">Security + approval posture</p>
          </div>
          <div className="mt-4 grid gap-2">
            {[
              "Humans approve risky actions; agents suggest and structure only.",
              "Blue, Bari, and Internal can be used as review escalations for claims, voice, and strategy.",
              "Demo/manual mode remains active until live services are configured.",
              "Agents cannot bypass final approval, compliance, or send/publish gates.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4 text-slate-400" />
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>
        </ControlPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ControlPanel className="p-4">
          <p className="text-sm font-semibold text-slate-100">Agent / model defaults preview</p>
          <p className="mt-1 text-xs text-slate-500">Demo posture rows from packaged agent definitions — not live runtime configuration unless Convex agents are connected.</p>
          <div className="mt-4 space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-100">{agent.name}</span>
                  <StatusBadge tone={agent.status === "needs_config" ? "amber" : "green"}>{humanizeAgentStatus(agent.status)}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-400">{agent.model}</p>
              </div>
            ))}
          </div>
        </ControlPanel>

        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-violet-300" />
            <p className="text-sm font-semibold text-slate-100">Environment + audit visibility</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Hermes by Nous can later coordinate approved workflows from the office Mac mini once HERMES_RUNTIME_URL and policies are configured. Default posture
            remains dry-run, read-only, and approval-gated for external actions — not live autonomous execution by default.
          </p>
          <ConsoleTable className="mt-4">
            <TableHead>
              <tr>
                <Th>Event</Th>
                <Th>Target</Th>
                <Th>State</Th>
              </tr>
            </TableHead>
            <tbody>
              {auditEvents.map((event) => (
                <tr key={event.id}>
                  <Td>
                    {event.actor} {event.action}
                  </Td>
                  <Td>{event.target}</Td>
                  <Td>Recorded</Td>
                </tr>
              ))}
            </tbody>
          </ConsoleTable>
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
            {integrations.length} integrations are documented here. This page never displays secret values and stays safe for demo review.
          </div>
        </ControlPanel>
      </section>
    </div>
  );
}
