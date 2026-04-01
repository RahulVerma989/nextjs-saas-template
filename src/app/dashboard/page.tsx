import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { siteConfig } from '@/config/site.config';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your {siteConfig.name} account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="text-2xl font-bold mt-1 capitalize">{session.user.plan}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Credits</p>
          <p className="text-2xl font-bold mt-1">{session.user.creditBalance}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-2xl font-bold mt-1 capitalize">{session.user.accountStatus}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>1. Configure your environment variables in <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">.env.local</code></p>
          <p>2. Set up billing plans in <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">src/config/plans.config.ts</code></p>
          <p>3. Add your MCP tools in <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">src/config/mcp-tools.config.ts</code></p>
          <p>4. Customize the landing page at <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">src/app/page.tsx</code></p>
        </div>
      </div>
    </div>
  );
}
