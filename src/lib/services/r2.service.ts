import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2/S3 environment variables not configured');
    }

    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

function getBucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME not configured');
  return bucket;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getR2SignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const s3 = getClient();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
    { expiresIn }
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const s3 = getClient();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );
}

export function generateUploadKey(folder: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'png';
  return `${folder}/${Date.now()}.${ext}`;
}
