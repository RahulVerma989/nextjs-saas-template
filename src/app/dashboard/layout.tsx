import { redirect } from 'next/navigation';
import { SessionProvider } from '@/components/providers/session-provider';
import { SidebarProvider } from '@/context/sidebar-context';
import { CreditsProvider } from '@/context/credits-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { isFeatureEnabled } from '@/lib/features/gate';
import { isDemoMode } from '@/lib/auth/demo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isFeatureEnabled('auth')) {
    redirect('/');
  }
  // ThemeProvider is mounted at the root layout so the toggle stays
  // in sync between landing and dashboard.  Don't add a second one
  // here — it would create duplicate state and re-introduce the
  // toggle-flicker bug we just fixed.
  return (
    <SessionProvider>
      <SidebarProvider>
        <CreditsProvider>
          <div className="min-h-screen bg-background">
            <Sidebar isDemo={isDemoMode()} />
            <DashboardShell>
              <Header />
              <main className="p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </DashboardShell>
          </div>
        </CreditsProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}
