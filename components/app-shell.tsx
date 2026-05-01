"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SignIn, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Menu, Plus, Search, Shield, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { getActiveNavCategory, getActiveNavChild, navGroups } from "@/lib/navigation";
import { appBranding } from "@/lib/branding";
import { canAccessPath, filterNavGroupsForRole, roleLabel, type UserRole } from "@/lib/auth";
import { SageTopBarLogo } from "@/components/brand/sage-top-bar-logo";
import { AppUserProvider, type AppUserState } from "@/components/auth/app-user-context";
import { useCurrentAppUser } from "@/components/auth/use-current-app-user";
import { Button, Pill, StatusBadge, StatusDot } from "@/components/ui";
import { cn } from "@/lib/utils";

function Sidebar({ pathname, groups, modeLabel }: { pathname: string; groups: typeof navGroups; modeLabel: string }) {
  const activeCategory = getActiveNavCategory(pathname, groups);

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
          {groups.map((group) => {
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
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{modeLabel}</span>
            <StatusDot tone="green" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100">Human approval remains authoritative</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Console access is role-aware, with approvals and edits gated by the signed-in user when Clerk is configured.</p>
        </div>
      </div>
    </aside>
  );
}

function MobileNav({
  pathname,
  groups,
  open,
  onToggle,
  onClose,
}: {
  pathname: string;
  groups: typeof navGroups;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const activeCategory = getActiveNavCategory(pathname, groups);
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
            {groups.map((group) => {
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

function SignInScreen() {
  return (
    <div className="min-h-screen bg-[#070d16] px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28rem),linear-gradient(180deg,#09111d_0%,#08111c_30%,#070d16_100%)] p-6 shadow-2xl md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="space-y-4">
            <Pill tone="blue">
              <Shield className="h-3.5 w-3.5" />
              Auth required
            </Pill>
            <div>
              <h1 className="text-3xl font-semibold text-slate-50">Sign in to the Outreach Console</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                This console now protects campaign, approval, library, response, and integration data behind authenticated access. Sign in with your Clerk account to continue.
              </p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-4">
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
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

function ShellFrame({
  children,
  pathname,
  role,
  displayName,
  avatarInitials,
  clerkConfigured,
}: {
  children: ReactNode;
  pathname: string;
  role: UserRole;
  displayName: string;
  avatarInitials: string;
  clerkConfigured: boolean;
}) {
  const router = useRouter();
  const allowedNavGroups = useMemo(() => filterNavGroupsForRole(navGroups, role), [role]);
  const hasAccess = canAccessPath(role, pathname);
  const fallbackPath = allowedNavGroups[0]?.defaultHref ?? "/dashboard";
  const activeCategory = getActiveNavCategory(pathname, allowedNavGroups);
  const activeChild = getActiveNavChild(pathname, activeCategory);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [taskReturnContext, setTaskReturnContext] = useState<{
    active: boolean;
    source: "today";
    destinationMode: "campaign" | "review" | "library" | "intelligence" | "operations";
    taskId: string;
    returnRoute: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const topBarState = useQuery(api.globalStatus.getGlobalTopBarState);
  const notifications = useQuery(api.globalStatus.getGlobalNotifications);
  const searchRecords = useQuery(api.globalStatus.getGlobalSearchRecords);
  const approvalCount = topBarState?.pendingApprovalCount ?? 0;
  const allowedNotifications = useMemo(
    () => (notifications ?? []).filter((notification: { sourceRoute: string }) => canAccessPath(role, notification.sourceRoute)),
    [notifications, role],
  );
  const allowedSearchRecords = useMemo(
    () => (searchRecords ?? []).filter((record: { route: string }) => canAccessPath(role, record.route)),
    [role, searchRecords],
  );
  const notificationCount = allowedNotifications.length;
  const searchResults = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery || !allowedSearchRecords) return [];
    return allowedSearchRecords.filter((record: { title: string; type: string; description: string; status?: string; keywords?: string[] }) => {
      const haystack = [record.title, record.type, record.description, record.status, ...(record.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [allowedSearchRecords, deferredQuery]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("oc_task_return_context");
    if (!raw) {
      setTaskReturnContext(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        active?: boolean;
        source?: "today";
        destinationMode?: "campaign" | "review" | "library" | "intelligence" | "operations";
        taskId?: string;
        returnRoute?: string;
      };
      if (parsed.active && parsed.source === "today" && parsed.destinationMode && parsed.taskId && parsed.returnRoute) {
        setTaskReturnContext({
          active: true,
          source: "today",
          destinationMode: parsed.destinationMode,
          taskId: parsed.taskId,
          returnRoute: parsed.returnRoute,
        });
      } else {
        window.sessionStorage.removeItem("oc_task_return_context");
        setTaskReturnContext(null);
      }
    } catch {
      window.sessionStorage.removeItem("oc_task_return_context");
      setTaskReturnContext(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (!taskReturnContext?.active) return;
    if (activeCategory.id !== taskReturnContext.destinationMode) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oc_task_return_context");
      }
      setTaskReturnContext(null);
    }
  }, [activeCategory.id, taskReturnContext]);

  const backToTasks = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("oc_task_return_context");
    }
    setTaskReturnContext(null);
    router.push("/dashboard");
  };

  return (
    <>
      <div className="min-h-screen bg-[#070d16] lg:flex">
        <Sidebar pathname={pathname} groups={allowedNavGroups} modeLabel={`${roleLabel(role)} mode`} />
        <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.05),transparent_26rem),linear-gradient(180deg,#09111d_0%,#08111c_30%,#070d16_100%)]">
          <header className="border-b border-slate-800 bg-[#07111e]/92 px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MobileNav
                  pathname={pathname}
                  groups={allowedNavGroups}
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
                  <StatusBadge tone={approvalCount > 0 ? "amber" : "gray"}>{`${approvalCount} approval${approvalCount === 1 ? "" : "s"}`}</StatusBadge>
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
                    <StatusBadge tone={topBarState?.healthStatus === "error" ? "red" : topBarState?.healthStatus === "warning" ? "amber" : "green"}>
                      {topBarState?.healthLabel ?? "Checking"}
                    </StatusBadge>
                  </button>
                  {statusOpen ? (
                    <PopoverCard title="System Health" onClose={() => setStatusOpen(false)}>
                      <div className="space-y-2">
                        {topBarState?.healthItems?.length ? topBarState.healthItems.map((item: { label: string; tone: string; value: string }) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <StatusDot tone={item.tone} />
                              <span className="text-sm font-medium text-slate-100">{item.label}</span>
                            </div>
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-300">{item.value}</span>
                          </div>
                        )) : (
                          <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/80 px-3 py-5 text-sm text-slate-400">
                            {topBarState?.healthSummary ?? "Loading system health..."}
                          </p>
                        )}
                      </div>
                    </PopoverCard>
                  ) : null}
                </div>
                {role === "admin" || role === "operator" ? (
                  <button type="button" onClick={() => router.push("/campaigns/new")} className="rounded-lg">
                    <Button><Plus className="mr-2 h-4 w-4" /> Create Campaign</Button>
                  </button>
                ) : null}
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
                      {notifications === undefined ? (
                        <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/80 px-3 py-5 text-sm text-slate-400">Loading notifications...</p>
                      ) : allowedNotifications.length ? (
                        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
                        <div className="space-y-2">
                          {allowedNotifications.map((notification: { notificationId: string; title: string; description: string; sourceRoute: string }) => (
                            <button
                              key={notification.notificationId}
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false);
                                router.push(notification.sourceRoute);
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
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-slate-800 bg-slate-950/80 px-3 py-5 text-sm text-slate-400">No notifications.</p>
                      )}
                    </PopoverCard>
                  ) : null}
                </div>
                <Pill tone={clerkConfigured ? "green" : "blue"}><Shield className="h-3.5 w-3.5" /> {roleLabel(role)}</Pill>
                <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-slate-100">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-700 bg-slate-900 text-xs font-bold text-sky-200">
                    {avatarInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-400">{roleLabel(role)}</p>
                  </div>
                  {clerkConfigured ? <UserButton /> : null}
                </div>
              </div>
            </div>
          </header>
          <div className="min-h-[calc(100vh-4.5rem)] bg-transparent px-4 py-5 md:px-6">
            {!hasAccess ? (
              <div className="mx-auto max-w-[96rem]">
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-6 text-rose-100">
                  <p className="text-sm font-semibold">Not authorized</p>
                  <p className="mt-2 text-sm leading-6 text-rose-50/90">
                    Your current role can&apos;t access this section. Use your allowed review queue or return to the dashboard.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => router.push(fallbackPath)} className="rounded-lg">
                      <Button>Go to allowed view</Button>
                    </button>
                    <button type="button" onClick={() => router.push("/dashboard")} className="rounded-lg">
                      <Button variant="secondary">Home</Button>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
            <div className="mx-auto mb-5 max-w-[96rem] overflow-x-auto">
              <div className={cn(activeCategory.id === "home" ? "" : "flex min-w-max gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2")}>
                {activeCategory.id === "home" ? null : activeCategory.children.map((child) => {
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
            {taskReturnContext?.active && activeCategory.id === taskReturnContext.destinationMode ? (
              <div className="mx-auto mb-4 max-w-[96rem]">
                <button
                  className="focus-ring inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                  onClick={backToTasks}
                  type="button"
                >
                  Back to Tasks
                </button>
              </div>
            ) : null}
            {children}
              </>
            )}
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
                  placeholder="Search campaigns, approvals, replies, offers, tasks, integrations, and agents."
                  className="w-full border-0 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="mt-4 max-h-[65vh] overflow-auto">
              {!query.trim() ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 px-5 py-10 text-center text-sm text-slate-400">
                  Search campaigns, approvals, replies, offers, tasks, integrations, and agents.
                </div>
              ) : searchRecords === undefined ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/80 px-5 py-10 text-center text-sm text-slate-400">
                  Loading searchable records...
                </div>
              ) : searchResults.length ? (
                <div className="space-y-2">
                  {searchResults.map((result: { id: string; route: string; title: string; type: string; description: string }) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        closeSearch();
                        router.push(result.route);
                      }}
                      className="focus-ring flex w-full items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{result.title}</p>
                        <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-slate-400">{result.type}</p>
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

function ClerkShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/dashboard";
  const user = useCurrentAppUser();

  if (!user.isLoaded) {
    return (
      <div className="min-h-screen bg-[#070d16] px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-950/80 px-6 py-10 text-center text-slate-300">
          Loading authenticated console…
        </div>
      </div>
    );
  }

  if (!user.isSignedIn) {
    return <SignInScreen />;
  }

  const appUserState: AppUserState = {
    clerkConfigured: true,
    isLoaded: user.isLoaded,
    isSignedIn: user.isSignedIn,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    clerkUserId: user.clerkUserId,
    avatarInitials: user.avatarInitials,
  };

  return (
    <AppUserProvider value={appUserState}>
      <ShellFrame
        pathname={pathname}
        role={user.role}
        displayName={user.displayName}
        avatarInitials={user.avatarInitials}
        clerkConfigured
      >
        {children}
      </ShellFrame>
    </AppUserProvider>
  );
}

export function AppShell({ children, title: _title }: { children: ReactNode; title: string }) {
  const pathname = usePathname() ?? "/dashboard";
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (clerkConfigured) {
    return <ClerkShell>{children}</ClerkShell>;
  }

  const demoUser: AppUserState = {
    clerkConfigured: false,
    isLoaded: true,
    isSignedIn: true,
    role: "operator",
    displayName: "Demo Operator",
    email: null,
    clerkUserId: null,
    avatarInitials: "DO",
  };

  return (
    <AppUserProvider value={demoUser}>
      <ShellFrame
        pathname={pathname}
        role={demoUser.role}
        displayName={demoUser.displayName}
        avatarInitials={demoUser.avatarInitials}
        clerkConfigured={false}
      >
        {children}
      </ShellFrame>
    </AppUserProvider>
  );
}
