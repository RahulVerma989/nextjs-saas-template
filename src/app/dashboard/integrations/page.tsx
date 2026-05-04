'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { siteConfig } from '@/config/site.config';

interface APIKeyData {
  _id: string;
  name: string;
  keyPrefix: string;
  enabledTools: string[];
  createdAt: string;
  lastUsedAt?: string;
}

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [keys, setKeys] = useState<APIKeyData[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/integrations/api-keys');
      const data = await res.json();
      // API shape: { success, data: { keys: APIKeyData[] } }.  The earlier
      // version assigned `data.data` directly, which set `keys` to the
      // wrapper object and crashed `.length` / `.map`.
      if (data.success) setKeys(data.data?.keys ?? []);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    const res = await fetch('/api/integrations/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName, enabledTools: [] }),
    });
    const data = await res.json();
    if (data.success) {
      setCreatedKey(data.data.rawKey);
      setNewKeyName('');
      fetchKeys();
    }
  };

  const revokeKey = async (keyId: string) => {
    await fetch(`/api/integrations/api-keys/${keyId}`, { method: 'DELETE' });
    fetchKeys();
  };

  const mcpConfig = session?.user ? {
    mcpServers: {
      [siteConfig.name.toLowerCase()]: {
        url: `${siteConfig.url}/api/mcp`,
        headers: { Authorization: 'Bearer YOUR_API_KEY' },
      },
    },
  } : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Integrations</h1>
      <p className="text-muted-foreground mb-8">Manage API keys and MCP configuration.</p>

      {/* MCP Config */}
      {siteConfig.features.mcp && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">MCP Configuration</h2>
          <p className="text-sm text-muted-foreground mb-3">Add this to your MCP client configuration:</p>
          <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
            {JSON.stringify(mcpConfig, null, 2)}
          </pre>
        </div>
      )}

      {/* Create Key */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production)"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={createKey}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            Create
          </button>
        </div>

        {createdKey && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">API key created! Copy it now — it won&apos;t be shown again.</p>
            <code className="text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded break-all">{createdKey}</code>
          </div>
        )}
      </div>

      {/* Key List */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Your API Keys</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key._id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground">{key.keyPrefix}... &middot; Created {new Date(key.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => revokeKey(key._id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
