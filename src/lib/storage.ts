import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";

let bucketReady = false;

/**
 * Creates the storage bucket on first use if it doesn't exist yet, so
 * there's no manual Supabase dashboard step required beyond the SQL
 * migrations. Private bucket — screenshots and generated .docx files are
 * only ever served via short-lived signed URLs, never a public path.
 */
async function ensureBucket(): Promise<string> {
  const { STORAGE_BUCKET } = getServerEnv();
  if (bucketReady) return STORAGE_BUCKET;

  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === STORAGE_BUCKET)) {
    const { error } = await admin.storage.createBucket(STORAGE_BUCKET, { public: false });
    // Ignore a race where another request created it first.
    if (error && !error.message.includes("already exists")) throw error;
  }

  bucketReady = true;
  return STORAGE_BUCKET;
}

export async function uploadFile(
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<void> {
  const bucket = await ensureBucket();
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: true });
  if (error) throw error;
}

export async function getSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const bucket = await ensureBucket();
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw error ?? new Error("Could not create signed URL");
  return data.signedUrl;
}

export async function downloadFile(path: string): Promise<Buffer> {
  const bucket = await ensureBucket();
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error || !data) throw error ?? new Error("Could not download file");
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteFile(path: string): Promise<void> {
  const bucket = await ensureBucket();
  const admin = createAdminClient();
  await admin.storage.from(bucket).remove([path]);
}

export function screenshotPath(reportId: string, screenshotId: string, ext: string): string {
  return `screenshots/${reportId}/${screenshotId}.${ext}`;
}

export function docxPath(reportId: string): string {
  return `exports/${reportId}.docx`;
}

export function receiptPath(transactionId: string, ext: string): string {
  return `receipts/${transactionId}.${ext}`;
}
