import { Sidebar } from "./Sidebar";

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
        <main className="flex-1 overflow-y-auto bg-background/95 backdrop-blur-[2px]">
          {children}
        </main>
      </div>
    </div>
  );
}
