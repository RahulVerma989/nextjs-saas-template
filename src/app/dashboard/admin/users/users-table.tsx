'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Save } from 'lucide-react';

interface UserRow {
  _id: string;
  email: string;
  name: string;
  plan: string;
  accountStatus: string;
  roles: string[];
  createdAt: string;
}

interface Props {
  users: UserRow[];
  page: number;
  totalPages: number;
  search: string;
  readOnly: boolean;
}

const PLANS = ['free', 'early_adopter', 'starter', 'pro', 'enterprise'] as const;
const STATUSES = ['pending', 'pending_review', 'approved', 'rejected', 'waitlist'] as const;

export function UsersTable(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(props.search);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const updateQuery = (next: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/dashboard/admin/users?${sp.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput || undefined, page: '1' });
  };

  const updateUser = async (
    userId: string,
    field: 'plan' | 'accountStatus' | 'roles',
    value: string | string[],
  ) => {
    setSavingId(userId);
    setErrorId(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorId(userId);
        // For demo mode the API returns code: 'DEMO_MODE'.  We surface
        // it lightly because the banner already explains the policy.
      } else {
        router.refresh();
      }
    } catch {
      setErrorId(userId);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Plan</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Admin</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {props.users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No users match this query.
                </td>
              </tr>
            ) : (
              props.users.map((u) => {
                const isAdmin = u.roles.includes('admin');
                const isSaving = savingId === u._id;
                const hasError = errorId === u._id;
                return (
                  <tr key={u._id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {hasError && (
                        <div className="text-xs text-destructive mt-1">
                          Update rejected (try again or check demo mode)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={props.readOnly || isSaving}
                        value={u.plan}
                        onChange={(e) => updateUser(u._id, 'plan', e.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={props.readOnly || isSaving}
                        value={u.accountStatus}
                        onChange={(e) =>
                          updateUser(u._id, 'accountStatus', e.target.value)
                        }
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        disabled={props.readOnly || isSaving}
                        checked={isAdmin}
                        onChange={(e) =>
                          updateUser(
                            u._id,
                            'roles',
                            e.target.checked ? ['user', 'admin'] : ['user'],
                          )
                        }
                        className="h-4 w-4 rounded border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                      {isSaving && (
                        <span className="ml-2 inline-flex items-center text-primary">
                          <Save className="h-3 w-3 mr-1" /> saving…
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {props.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            disabled={props.page <= 1}
            onClick={() => updateQuery({ page: String(props.page - 1) })}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {props.page} / {props.totalPages}
          </span>
          <button
            disabled={props.page >= props.totalPages}
            onClick={() => updateQuery({ page: String(props.page + 1) })}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
