import { SessionProvider } from '@/components/providers/session-provider';
import { ThemeProvider } from '@/context/theme-context';
import { SidebarProvider } from '@/context/sidebar-context';
import { CreditsProvider } from '@/context/credits-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <SidebarProvider>
          <CreditsProvider>
            <div className="min-h-screen bg-background">
              <Sidebar />
              <DashboardShell>
                <Header />
                <main className="p-4 sm:p-6 lg:p-8">
                  {children}
                </main>
              </DashboardShell>
            </div>
          </CreditsProvider>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
