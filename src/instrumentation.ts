export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSecrets } = await import('@/lib/secrets/secrets-manager');
    await initSecrets();
    console.log('[Instrumentation] Secrets initialized');
  }
}
