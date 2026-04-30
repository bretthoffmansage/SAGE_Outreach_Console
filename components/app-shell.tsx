import Link from "next/link";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { navGroups } from "@/lib/navigation";
import { Button, Pill } from "@/components/ui";

function Sidebar() {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-[#eadfce] bg-[#fffaf2]/88 px-5 py-6 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#172033] text-lg font-bold text-white shadow-lg shadow-slate-900/15">AC</span>
        <span>
          <span className="block text-base font-bold text-[#172033]">AI Campaign Desk</span>
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-[#8a7357]">Marketing OS</span>
        </span>
      </Link>
      <nav className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#8a7357]">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#26324a] transition hover:bg-white hover:shadow-sm">
                    <Icon className="h-4 w-4 text-[#647094] transition group-hover:text-[#172033]" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function MobileNav() {
  return (
    <details className="lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#eadfce] bg-white/75 px-4 py-2 text-sm font-semibold text-[#172033] shadow-sm">
        <Menu className="h-4 w-4" /> Menu
      </summary>
      <div className="absolute left-4 right-4 top-20 z-50 max-h-[75vh] overflow-auto rounded-3xl border border-[#eadfce] bg-[#fffaf2] p-4 shadow-2xl">
        {navGroups.map((group) => (
          <div className="mb-4" key={group.title}>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#8a7357]">{group.title}</p>
            <div className="grid gap-1">
              {group.items.map((item) => <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white" key={item.href} href={item.href}>{item.title}</Link>)}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-[#eadfce]/80 bg-[#fbf7ef]/88 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MobileNav />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8a7357]">Current page</p>
                <h1 className="text-xl font-bold text-[#172033] md:text-2xl">{title}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex items-center gap-2 rounded-full border border-[#eadfce] bg-white/75 px-4 py-2 text-sm text-[#6f7685] shadow-sm">
                <Search className="h-4 w-4" /> Search campaigns, rules, replies
              </div>
              <Pill tone="amber">7 approvals</Pill>
              <Pill tone="green">Demo healthy</Pill>
              <Button><Plus className="mr-2 h-4 w-4" /> Create</Button>
              <Bell className="h-5 w-5 text-[#647094]" />
            </div>
          </div>
        </header>
        <div className="px-4 py-8 md:px-8">{children}</div>
      </main>
    </div>
  );
}
