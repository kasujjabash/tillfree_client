"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";

/**
 * Sidebar (organisation, navigation, account) + inset content panel with a
 * compact top bar. Only the content panel scrolls, so navigation and context
 * stay in view on long tables.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-svh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-surface px-3 py-2 text-label shadow-[var(--shadow-overlay)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden bg-surface md:h-[calc(100svh-1rem)] md:border md:peer-data-[variant=inset]:shadow-none">
        <TopBar />
        <div id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
