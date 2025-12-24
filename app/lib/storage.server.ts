import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Storage type configuration
 */
const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL;
const LOCAL_TRANSCRIPTS_PATH = process.env.LOCAL_TRANSCRIPTS_PATH || "./public/audio/transcripts";

/**
 * Initialize S3 client (only when using S3 or LocalStack)
 */
let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (STORAGE_TYPE === "local") {
    return null;
  }

  if (!s3Client) {
    const config: {
      region: string;
      endpoint?: string;
      forcePathStyle?: boolean;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    } = {
      region: AWS_REGION,
    };

    // LocalStack configuration
    if (AWS_ENDPOINT_URL) {
      config.endpoint = AWS_ENDPOINT_URL;
      config.forcePathStyle = true; // Required for LocalStack
    }

    // AWS credentials (optional - can use IAM role in production)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }

    s3Client = new S3Client(config);
  }

  return s3Client;
}

/**
 * Get transcript audio file URL
 * Returns local path for local storage, or presigned S3 URL for S3 storage
 */
export async function getTranscriptAudioUrl(s3Key: string): Promise<string> {
  if (STORAGE_TYPE === "local") {
    // Remove leading "./" if present and ensure path starts with /
    const cleanPath = LOCAL_TRANSCRIPTS_PATH.replace(/^\.\//, "");
    const cleanKey = s3Key.startsWith("/") ? s3Key : `/${s3Key}`;
    return `${cleanPath}${cleanKey}`;
  }

  // S3 or LocalStack
  if (!AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET environment variable is required for S3 storage");
  }

  const client = getS3Client();
  if (!client) {
    throw new Error("S3 client not initialized");
  }

  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3Key,
  });

  // Generate presigned URL (valid for 1 hour)
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return url;
}

/**
 * Get transcript text file URL (if stored separately in S3)
 * Returns local path for local storage, or presigned S3 URL for S3 storage
 */
export async function getTranscriptTextUrl(s3TextKey: string | null): Promise<string | null> {
  if (!s3TextKey) {
    return null;
  }

  if (STORAGE_TYPE === "local") {
    const cleanPath = LOCAL_TRANSCRIPTS_PATH.replace(/^\.\//, "");
    const cleanKey = s3TextKey.startsWith("/") ? s3TextKey : `/${s3TextKey}`;
    return `${cleanPath}${cleanKey}`;
  }

  // S3 or LocalStack
  if (!AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET environment variable is required for S3 storage");
  }

  const client = getS3Client();
  if (!client) {
    throw new Error("S3 client not initialized");
  }

  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3TextKey,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return url;
}

/**
 * Get transcript text content from S3 or local filesystem
 * Supports both S3 and local storage for dev testing
 */
export async function getTranscriptTextContent(s3TextKey: string | null): Promise<string | null> {
  if (!s3TextKey) {
    return null;
  }

  // Local storage: read from filesystem
  if (STORAGE_TYPE === "local") {
    return getLocalFileContent(s3TextKey);
  }

  // S3 storage
  if (!AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET environment variable is required for S3 storage");
  }

  const client = getS3Client();
  if (!client) {
    throw new Error("S3 client not initialized");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: s3TextKey,
    });

    const response = await client.send(command);
    const text = await response.Body?.transformToString();

    return text || null;
  } catch (error) {
    console.error("Failed to fetch transcript text from S3:", error);
    return null;
  }
}

/**
 * Read file content from local filesystem
 * Used for local development testing
 */
export async function getLocalFileContent(relativePath: string): Promise<string | null> {
  try {
    // Handle paths that might include the public prefix or not
    let filePath = relativePath;
    
    // If path starts with public/, use it directly from project root
    if (relativePath.startsWith("public/")) {
      filePath = join(process.cwd(), relativePath);
    } else if (relativePath.startsWith("audio/")) {
      // If path is like "audio/transcripts/...", prepend public/
      filePath = join(process.cwd(), "public", relativePath);
    } else {
      // Otherwise use LOCAL_TRANSCRIPTS_PATH
      filePath = join(process.cwd(), LOCAL_TRANSCRIPTS_PATH.replace(/^\.\//, ""), relativePath);
    }

    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Failed to read local file:", relativePath, error);
    return null;
  }
}

/**
 * Check if storage is configured for S3
 */
export function isS3Storage(): boolean {
  return STORAGE_TYPE === "s3" || STORAGE_TYPE === "localstack" || !!AWS_ENDPOINT_URL;
}

/**
 * Get storage type
 */
export function getStorageType(): string {
  return STORAGE_TYPE;
}

