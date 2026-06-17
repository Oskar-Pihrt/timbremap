import Sidebar from "@/components/Sidebar";

/** Two-column layout: navigation sidebar on the left, content on the right. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">{children}</main>
    </div>
  );
}
