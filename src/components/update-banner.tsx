'use client';

import { useEffect, useState } from 'react';
import { X, ArrowUpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
}

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedVersion = localStorage.getItem('update-dismissed-version');

    fetch('/api/updates')
      .then((res) => res.json())
      .then((data: UpdateInfo) => {
        if (data.updateAvailable && data.latestVersion !== dismissedVersion) {
          setUpdate(data);
        }
      })
      .catch(() => {}); // Silently fail
  }, []);

  if (!update || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (update.latestVersion) {
      localStorage.setItem('update-dismissed-version', update.latestVersion);
    }
  };

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ArrowUpCircle className="h-5 w-5 text-primary shrink-0" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-sm font-medium">Update available</span>
            <Badge variant="secondary" className="text-xs">
              {update.currentVersion} → {update.latestVersion}
            </Badge>
            {update.releaseName && (
              <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                — {update.releaseName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {update.releaseUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={update.releaseUrl} target="_blank" rel="noopener noreferrer">
                View Release <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
