"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Page, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { BusinessOverviewPanel } from "./business-overview";
import { HealthcareOverviewPanel } from "./healthcare-overview";

/**
 * Contextual overview: the organisation's industries decide which panel(s)
 * render, and each panel only shows figures for modules the organisation has
 * and the member may view.
 */
export function OverviewScreen() {
  const { organisation, activeBranch, format } = useWorkspace();
  const [hideNames, setHideNames] = useState(false);
  const hasBusiness = organisation.industries.includes("business");
  const hasHealthcare = organisation.industries.includes("healthcare");

  const today = new Intl.DateTimeFormat(format.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: format.timeZone,
  }).format(new Date());

  const privacyToggle = hasHealthcare && (
    <Button variant="outline" size="sm" onClick={() => setHideNames((v) => !v)} aria-pressed={hideNames}>
      {hideNames ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
      {hideNames ? "Show patient names" : "Hide patient names"}
    </Button>
  );

  return (
    <Page>
      <PageHeader
        title="Overview"
        description={`${activeBranch?.name ?? "All branches"} · ${today}`}
        actions={privacyToggle}
      />
      {hasBusiness && hasHealthcare ? (
        <Tabs defaultValue="healthcare" className="gap-5">
          <TabsList>
            <TabsTrigger value="healthcare">Healthcare</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
          <TabsContent value="healthcare">
            <HealthcareOverviewPanel hideNames={hideNames} />
          </TabsContent>
          <TabsContent value="business">
            <BusinessOverviewPanel />
          </TabsContent>
        </Tabs>
      ) : hasHealthcare ? (
        <HealthcareOverviewPanel hideNames={hideNames} />
      ) : (
        <BusinessOverviewPanel />
      )}
    </Page>
  );
}
