import { isDemoMode } from '@/lib/auth/demo';
import { Sparkles } from 'lucide-react';

/**
 * Inline banner shown at the top of admin pages while DEMO_MODE=true,
 * so visitors know why their writes get rejected with 403.
 *
 * Renders nothing in production — the import is server-side only so
 * the Tailwind classes don't even ship to the client when off.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <Sparkles className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div>
        <div className="font-medium text-foreground">Demo Mode</div>
        <p className="text-muted-foreground mt-0.5">
          You&apos;re viewing the admin UI as a demo visitor. Reads work, but
          destructive actions (delete user, change roles, etc.) are blocked at
          the API layer so the demo stays usable for everyone. Set{' '}
          <code className="text-xs">DEMO_MODE=false</code> in your env to
          unlock writes.
        </p>
      </div>
    </div>
  );
}
