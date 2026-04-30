import { AppShell } from "@/components/app-shell";
import { CampaignRouteSection, DashboardSection } from "@/components/campaign-sections";
import { IntelligenceRouteSection } from "@/components/intelligence-sections";
import { LibraryRouteSection } from "@/components/library-sections";
import { OperationsRouteSection } from "@/components/operations-sections";
import { ReviewRouteSection } from "@/components/review-sections";
import { SettingsSection } from "@/components/settings-section";
import { titleFromSlug } from "@/lib/utils";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const title = titleFromSlug(slug);

  if (!slug || slug[0] === "dashboard") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <DashboardSection />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "campaigns") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <CampaignRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "reviews") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <ReviewRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "libraries") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <LibraryRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "intelligence") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <IntelligenceRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  if (slug[0] === "operations") {
    return (
      <AppShell title={title}>
        <div className="mx-auto max-w-[96rem]">
          <OperationsRouteSection slug={slug} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={title}>
      <div className="mx-auto max-w-[96rem]">
        <SettingsSection />
      </div>
    </AppShell>
  );
}
