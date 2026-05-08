import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db/connection';
import { getUserCrud } from '@/lib/db/crud/user.crud';
import { isDemoMode, shouldMaskPiiFor, maskEmail } from '@/lib/auth/demo';
import { DemoBanner } from '@/components/demo-banner';
import { UsersTable } from './users-table';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.roles?.includes('admin')) redirect('/dashboard');

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const search = sp.search ?? '';
  const limit = 20;

  await connectDB();
  const userCrud = getUserCrud();
  const result = await userCrud.listUsers({ page, limit, search });

  // Same masking the API does — applied here too because the table
  // renders server-side (no API hop).  Owner allowlist sees real
  // emails; demo visitors see e.g. "ra***@gmail.com".
  const mask = shouldMaskPiiFor(session.user.email);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Users</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {result.total} total · page {result.page} of {result.totalPages || 1}
      </p>

      <DemoBanner />

      <UsersTable
        users={result.items.map((u) => ({
          _id: u._id,
          email: mask ? maskEmail(u.email) : u.email,
          name: u.name,
          plan: u.plan,
          accountStatus: u.accountStatus,
          roles: u.roles ?? [],
          createdAt: u.createdAt
            ? new Date(u.createdAt).toISOString()
            : new Date().toISOString(),
        }))}
        page={page}
        totalPages={result.totalPages || 1}
        search={search}
        readOnly={isDemoMode()}
      />
    </div>
  );
}
