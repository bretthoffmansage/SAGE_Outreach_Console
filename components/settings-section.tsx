import { KeyRound, Lock, ShieldCheck, UserCog } from "lucide-react";
import { agents, auditEvents, integrations, users } from "@/lib/data/demo-data";
import { Button, ConsoleTable, ControlPanel, SectionHeader, StatusBadge, Td, Th, TableHead } from "@/components/ui";

export function SettingsSection() {
  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Console settings"
        title="Settings"
        description="Branding, roles, approval routing defaults, demo data posture, agent defaults, and operator preferences."
        actions={<Button variant="secondary">Save console defaults</Button>}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <ControlPanel className="p-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-sky-300" />
            <p className="text-sm font-semibold text-slate-100">Users + roles</p>
          </div>
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
                  <Td>{user.roles.join(", ")}</Td>
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
              "Human approval remains authoritative for risky actions.",
              "Approval routing defaults can require Bari, Blue, and internal review.",
              "Demo data mode remains active until live services are configured.",
              "Agents may not bypass final approval or compliance gates.",
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
          <p className="text-sm font-semibold text-slate-100">Agent / model defaults</p>
          <div className="mt-4 space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-100">{agent.name}</span>
                  <StatusBadge tone={agent.status === "needs_config" ? "amber" : "green"}>{agent.status.replace(/_/g, " ")}</StatusBadge>
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
                  <Td>{event.actor} {event.action}</Td>
                  <Td>{event.target}</Td>
                  <Td>recorded</Td>
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
