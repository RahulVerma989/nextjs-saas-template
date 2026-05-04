import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, ShieldCheck, CreditCard, Activity, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import { siteConfig } from '@/config/site.config';
import { connectDB } from '@/lib/db/connection';
import { User, Subscription } from '@/lib/db/models';
import { DemoBanner } from '@/components/demo-banner';

export const dynamic = 'force-dynamic';

/**
 * Admin overview — read-only stats so demo visitors see the same
 * shape an operator would see in production.  All write actions live
 * on sub-pages (e.g. /dashboard/admin/users) which call the
 * `requireAdminWriteApi` guard that 403s in demo mode.
 */
export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.roles?.includes('admin')) redirect('/dashboard');

  await connectDB();

  // Counts — kept simple to avoid heavy aggregations.
  const [
    totalUsers,
    pendingUsers,
    adminUsers,
    activeSubs,
    recentSignups,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ accountStatus: 'pending' }),
    User.countDocuments({ roles: 'admin' }),
    siteConfig.features.billing
      ? Subscription.countDocuments({ status: 'active' })
      : Promise.resolve(0),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id email name plan accountStatus createdAt')
      .lean(),
  ]);

  const stats = [
    { label: 'Total users', value: totalUsers, icon: Users },
    { label: 'Pending approval', value: pendingUsers, icon: Activity, tone: pendingUsers > 0 ? 'warn' : undefined },
    { label: 'Admins', value: adminUsers, icon: ShieldCheck },
    ...(siteConfig.features.billing
      ? [{ label: 'Active subscriptions', value: activeSubs, icon: CreditCard }]
      : []),
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Read-only overview of users and subscriptions for {siteConfig.name}.
      </p>

      <DemoBanner />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <s.icon
                className={`h-4 w-4 ${
                  s.tone === 'warn' ? 'text-warning' : 'text-muted-foreground'
                }`}
              />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/admin/users"
          className="group rounded-xl border border-border bg-card p-5 hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold">Users</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Search, view, and (when not in demo mode) update plan / role /
                status for any registered user.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </Link>

        {siteConfig.features.gscIndexing && (
          <Link
            href="/dashboard/settings/seo"
            className="group rounded-xl border border-border bg-card p-5 hover:bg-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">SEO / GSC</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect Google Search Console and view auto-indexing
                  status for marketing pages.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent signups</h2>
          <Link
            href="/dashboard/admin/users"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {recentSignups.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentSignups.map((u) => (
              <li
                key={u._id}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {u.plan}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      u.accountStatus === 'approved'
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {u.accountStatus}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
