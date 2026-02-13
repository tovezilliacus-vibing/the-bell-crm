import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { GlobalSearchBar } from "./GlobalSearchBar";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-content flex h-screen overflow-hidden">
      <div className="dashboard-backdrop" aria-hidden />
      <div className="flex flex-1 min-h-0 relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-[2px] flex flex-col min-h-0">
          <header className="sticky top-0 z-10 flex shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Suspense fallback={<div className="flex-1 max-w-sm h-9 rounded-md bg-muted/50" />}>
              <GlobalSearchBar />
            </Suspense>
          </header>
          <div className="flex-1 min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
