/**
 * Edge-safe lookup of the GSC META verification token + FILE token.
 *
 * Kept separate from `gsc.service.ts` so the root layout can pull the
 * value at request time without dragging the `googleapis` package into
 * the page bundle.  Cached for 60s — the connection rarely changes, so
 * we don't need a DB hit per render.
 */

import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { GSCConnection, GSC_CONNECTION_ID } from '@/lib/db/models';

interface VerificationSnapshot {
  metaToken?: string;
  fileName?: string;
  fileContent?: string;
}

async function loadSnapshot(): Promise<VerificationSnapshot> {
  try {
    await connectDB();
    const conn = await GSCConnection.findById(GSC_CONNECTION_ID)
      .select(
        'verificationMetaToken verificationFileName verificationFileContent',
      )
      .lean<{
        verificationMetaToken?: string;
        verificationFileName?: string;
        verificationFileContent?: string;
      }>();
    if (!conn) return {};
    return {
      metaToken: conn.verificationMetaToken,
      fileName: conn.verificationFileName,
      fileContent: conn.verificationFileContent,
    };
  } catch {
    return {};
  }
}

const cached = unstable_cache(loadSnapshot, ['gsc-verification-snapshot'], {
  revalidate: 60,
  tags: ['gsc-verification'],
});

export async function getGSCVerificationSnapshot(): Promise<VerificationSnapshot> {
  return cached();
}
