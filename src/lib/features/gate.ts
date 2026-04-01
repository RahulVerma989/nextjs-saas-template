import { notFound } from 'next/navigation';
import { siteConfig } from '@/config/site.config';

type Feature = keyof typeof siteConfig.features;

/**
 * Dependency map — if any dependency is disabled, the feature is auto-disabled.
 */
const DEPENDENCIES: Partial<Record<Feature, Feature[]>> = {
  billing: ['auth'],
  credits: ['auth'],
  mcp: ['auth', 'apiKeys'],
  adminPanel: ['auth'],
  apiKeys: ['auth'],
  notifications: ['auth'],
  fileUploads: ['auth'],
};

/**
 * Check whether a feature is enabled (respecting dependency chain).
 */
export function isFeatureEnabled(feature: Feature): boolean {
  if (!siteConfig.features[feature]) return false;

  const deps = DEPENDENCIES[feature];
  if (deps) {
    return deps.every((dep) => siteConfig.features[dep]);
  }

  return true;
}

/**
 * Call inside a Server Component or layout to return a 404 when
 * the feature is disabled. Keeps route files clean:
 *
 *   requireFeature('auth');
 */
export function requireFeature(feature: Feature): void {
  if (!isFeatureEnabled(feature)) {
    notFound();
  }
}
