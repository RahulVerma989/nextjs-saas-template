import { siteConfig } from '@/config/site.config';

/**
 * Demo-mode helpers.
 *
 * When `DEMO_MODE=true` is set in the env, the template behaves as a
 * public showcase:
 *   - Every authenticated user is granted the `admin` role at sign-in,
 *     so visitors can poke around the admin UI without needing their
 *     email pre-listed in `siteConfig.adminEmails`.
 *   - Destructive admin actions (delete user, change role, modify
 *     plan, disconnect GSC, etc.) are blocked at the API layer so a
 *     visitor can't break the demo for the next person.
 *   - The deployment OWNER (whose email IS in `siteConfig.adminEmails`,
 *     i.e. the explicit allowlist — not just demo-granted) bypasses
 *     the write block so they can still operate the system in
 *     production while showcasing it.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/** True when `email` is on the explicit owner allowlist. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return siteConfig.adminEmails.includes(email.toLowerCase());
}

/**
 * Should this admin write be allowed for `email`?
 *   - Outside demo mode: yes, always.
 *   - Inside demo mode: only the owner allowlist gets through;
 *     auto-admin demo visitors are blocked.
 */
export function isAdminWriteAllowed(
  email?: string | null | undefined,
): boolean {
  if (!isDemoMode()) return true;
  return isOwnerEmail(email);
}

/**
 * Partially mask an email for read-only demo visitors.  Keeps the
 * first 1-2 characters of the local part and the full domain so an
 * admin still recognises which user a row maps to, but a demo
 * visitor doesn't get a clean PII dump.  Real admins (owner
 * allowlist) see the unmasked email.
 *
 *   "rahul@gmail.com"     -> "ra***@gmail.com"
 *   "j@x.io"              -> "j***@x.io"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}***${domain}`;
}

/**
 * Convenience: should fields like email be masked for `viewerEmail`?
 * False for the deployment owner (they always see real data),
 * true for demo visitors.
 */
export function shouldMaskPiiFor(
  viewerEmail: string | null | undefined,
): boolean {
  if (!isDemoMode()) return false;
  return !isOwnerEmail(viewerEmail);
}
