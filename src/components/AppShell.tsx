import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type Role } from "@/lib/auth";
import { Activity } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppShell({
  children, requireRole, title,
}: { children: ReactNode; requireRole?: Role; title: string }) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (requireRole && role && role !== requireRole && role !== "admin") {
      navigate({ to: "/dashboard" });
    }
  }, [user, role, loading, requireRole, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Activity className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
