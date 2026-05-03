'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { siteConfig } from '@/config/site.config';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const isAdmin = (session?.user as { roles?: string[] } | undefined)?.roles?.includes('admin');
  const [name, setName] = useState(session?.user?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setMessage('Settings saved successfully.');
        await update();
      } else {
        setMessage('Failed to save settings.');
      }
    } catch {
      setMessage('An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <p className="text-sm text-muted-foreground mt-1">{session?.user?.email}</p>
          </div>

          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-destructive'}`}>
              {message}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Admin-only: SEO / Search Console connection */}
      {isAdmin && siteConfig.features.gscIndexing && (
        <Link
          href="/dashboard/settings/seo"
          className="block max-w-lg rounded-xl border border-border bg-card p-6 hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Search size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Search Engine Optimization</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect Google Search Console to auto-submit changed marketing
                pages to Google&apos;s Indexing API.
              </p>
            </div>
            <span className="text-muted-foreground">→</span>
          </div>
        </Link>
      )}
    </div>
  );
}
