"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Menu, Plus, Search, Shield, X } from "lucide-react";
import { getActiveNavCategory, getActiveNavChild, navGroups } from "@/lib/navigation";
import { appBranding } from "@/lib/branding";
import { SageTopBarLogo } from "@/components/brand/sage-top-bar-logo";
import {
  demoHealthItems,
  getNotificationsCount,
  getPendingApprovalCount,
  headerNotifications,
  searchShellRecords,
} from "@/lib/shell-data";
import { Button, Pill, StatusBadge, StatusDot } from "@/components/ui";
import { cn } from "@/lib/utils";

function Sidebar({ pathname }: { pathname: string }) {
  const activeCategory = getActiveNavCategory(pathname);

  return (
    <aside className="hidden w-[20rem] shrink-0 border-r border-slate-800 bg-[#060d16] lg:flex lg:flex-col">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-sky-500/40 bg-sky-500/12 text-sm font-bold text-sky-300">
            {appBranding.initials}
          </span>
          <p className="text-sm font-semibold text-slate-50">{appBranding.name}</p>
        </Link>
      </div>
      <div className="flex-1 overflow-auto px-3 py-4">
        <div className="space-y-1">
          {navGroups.map((group) => {
            const active = activeCategory.id === group.id;
            const Icon = group.icon;

            return (
              <Link
                key={group.id}
                href={group.defaultHref}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-sm text-slate-400 transition hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-100",
                  active && "border-slate-700 bg-slate-900 text-slate-50",
                )}
              >
                <span className={cn("absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-transparent", active && "bg-sky-400")} />
                <Icon className={cn("h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-200", active && "text-sky-300")} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{group.title}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Operator mode</span>
            <StatusDot tone="green" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100">Demo control environment</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Human approval remains authoritative across all review and send steps.</p>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({ pathname, open, onToggle, onClose }: { pathname: string; open: boolean; onToggle: () => void; onClose: () => void }) {
  const activeCategory = getActiveNavCategory(pathname);
  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        onClick={onToggle}
        className="focus-ring flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100"
      >
        <Menu className="h-4 w-4" />
        Menu
      </button>
      {open ? (
        <div className="absolute left-0 top-14 z-50 w-[20rem] rounded-2xl border border-slate-800 bg-[#08111c] p-3 shadow-2xl">
          <div className="space-y-1">
            {navGroups.map((group) => {
              const Icon = group.icon;
              return (
                <Link
                  key={group.id}
                  href={group.defaultHref}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-sm text-slate-400",
                    activeCategory.id === group.id && "border-slate-700 bg-slate-900 text-slate-50",
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="flex-1">{group.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PopoverCard({
  title,
  children,
  onClose,
  className,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div className={cn("absolute right-0 top-12 z-50 w-[24rem] rounded-2xl border border-slate-800 bg-[#08111c] p-4 shadow-2xl", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-500">{title}</p>
        <button type="button" onClick={onClose} className="focus-ring rounded-md p-1.5 text-slate-400">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  void title;
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const activeCategory = getActiveNavCategory(pathname);
  const activeChild = getActiveNavChild(pathname, activeCategory);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const approvalCount = getPendingApprovalCount();
  const notificationCount = getNotificationsCount();
  const searchResults = useMemo(() => searchShellRecords(deferredQuery), [deferredQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setSearchOpen(false);
        setStatusOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <>
      <div className="min-h-screen bg-[#070d16] lg:flex">
        <Sidebar pathname={pathname} />
        <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.05),transparent_26rem),linear-gradient(180deg,#09111d_0%,#08111c_30%,#070d16_100%)]">
          <header className="border-b border-slate-800 bg-[#07111e]/92 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MobileNav
                  pathname={pathname}
                  open={mobileNavOpen}
                  onToggle={() => setMobileNavOpen((value) => !value)}
                  onClose={() => setMobileNavOpen(false)}
                />
                <div className="hidden items-center pl-1 text-sky-300 md:flex">
                  <SageTopBarLogo />
                </div>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => {
                    setStatusOpen(false);
                    setNotificationsOpen(false);
                    setSearchOpen(true);
                  }}
                  className="focus-ring flex h-10 min-w-[19rem] items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/90 px-3 text-sm text-slate-300"
                >
                  <Search className="h-4 w-4" />
                  Search campaigns, rules, replies
                </button>
                <button type="button" onClick={() => router.push("/reviews/all")} className="focus-ring rounded-lg">
                  <StatusBadge tone="amber">{approvalCount} approvals</StatusBadge>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      setStatusOpen((value) => !value);
                    }}
                    className="focus-ring rounded-lg"
                  >
                    <StatusBadge tone="green">Demo healthy</StatusBadge>
                  </button>
                  {statusOpen ? (
                    <PopoverCard title="System Health" onClose={() => setStatusOpen(false)}>
                      <div className="space-y-2">
                        {demoHealthItems.map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2.5">
                            <span className="text-sm font-medium text-slate-100">{item.label}</span>
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverCard>
                  ) : null}
                </div>
                <button type="button" onClick={() => router.push("/campaigns/new")} className="rounded-lg">
                  <Button><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusOpen(false);
                      setNotificationsOpen((value) => !value);
                    }}
                    className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-300"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {notificationCount > 0 ? <span className="absolute -right-1 -top-1 rounded-md bg-rose-500 px-1.5 text-[0.62rem] font-bold text-white">{notificationCount}</span> : null}
                  </button>
                  {notificationsOpen ? (
                    <PopoverCard title="Notifications" onClose={() => setNotificationsOpen(false)}>
                      {headerNotifications.length ? (
                        <div className="space-y-2">
                          {headerNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false);
                                router.push(notification.href);
                              }}
                              className="focus-ring flex w-full items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-3 text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-100">{notification.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">{notification.description}</p>
                              </div>
                              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/80 px-3 py-5 text-sm text-slate-400">No notifications right now.</p>
                      )}
                    </PopoverCard>
                  ) : null}
                </div>
                <Pill tone="blue"><Shield className="h-3.5 w-3.5" /> demo</Pill>
              </div>
            </div>
          </header>
          <div className="min-h-[calc(100vh-4.5rem)] bg-transparent px-4 py-5 md:px-6">
            <div className="mx-auto mb-5 max-w-[96rem] overflow-x-auto">
              <div className="flex min-w-max gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                {activeCategory.children.map((child) => {
                  const isActive = activeChild.href === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-400 transition hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-100",
                        isActive && "border-sky-500/30 bg-slate-900 text-sky-200 shadow-[inset_0_-2px_0_0_rgba(56,189,248,0.9)]",
                      )}
                    >
                      {child.title}
                    </Link>
                  );
                })}
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/55 px-4 py-8 backdrop-blur-sm" onClick={closeSearch}>
          <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-slate-800 bg-[#08111c] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-400">Command Search</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">Search campaigns, queues, rules, and replies</h2>
              </div>
              <button type="button" onClick={closeSearch} className="focus-ring rounded-md p-1.5 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search campaigns, rules, replies, offers, and approvals."
                  className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="mt-4 max-h-[65vh] overflow-auto">
              {!query.trim() ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 px-5 py-10 text-center text-sm text-slate-400">
                  Search campaigns, rules, replies, offers, and approvals.
                </div>
              ) : searchResults.length ? (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push(result.href);
                      }}
                      className="focus-ring flex w-full items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{result.title}</p>
                        <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">{result.category}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{result.description}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 px-5 py-10 text-center text-sm text-slate-400">
                  No matching records found.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
