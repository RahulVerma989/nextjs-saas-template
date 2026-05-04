/**
 * Demo-mode helpers.
 *
 * When `DEMO_MODE=true` is set in the env, the template behaves as a
 * public showcase:
 *   - Every authenticated user is granted the `admin` role at sign-in,
 *     so visitors can poke around the admin UI without needing their
 *     email pre-listed in `siteConfig.admin.emails`.
 *   - Destructive admin actions (delete user, change role, modify
 *     plan, disconnect GSC, etc.) are blocked at the API layer so a
 *     visitor can't break the demo for the next person.
 *
 * In production, leave `DEMO_MODE` unset.  Real admins are still
 * controlled via `siteConfig.admin.emails` exactly as before.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

/**
 * Convenience: should this admin write be allowed?  False in demo
 * mode so callers can early-return a 403 without scattering the
 * `process.env.DEMO_MODE` check across routes.
 */
export function isAdminWriteAllowed(): boolean {
  return !isDemoMode();
}
