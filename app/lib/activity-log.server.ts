import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ActivityCategory = "auth" | "admin" | "page" | "transcript";
export type ActivityStatus = "success" | "failure" | "error";

export interface LogActivityParams {
  userId?: number;
  action: string;
  category: ActivityCategory;
  status: ActivityStatus;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an activity to the database
 * Fails silently to not break the app if logging fails
 */
export async function logActivity({
  userId,
  action,
  category,
  status,
  metadata,
  request,
}: LogActivityParams): Promise<void> {
  try {
    // Extract IP address from request headers
    let ipAddress: string | null = null;
    if (request) {
      ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") || // Cloudflare
        null;
    }

    // Extract user agent
    const userAgent = request?.headers.get("user-agent") || null;

    // Serialize metadata to JSON string
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        category,
        status,
        metadata: metadataJson,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log to console but don't throw - activity logging should never break the app
    console.error("Failed to log activity:", error);
  }
}

/**
 * Helper to get user info for metadata
 */
export function getUserMetadata(user: { id: number; email: string; role: string }) {
  return {
    email: user.email,
    role: user.role,
  };
}

/**
 * Helper to get admin action metadata
 */
export function getAdminActionMetadata(
  adminUser: { email: string },
  targetUser: { email: string; id?: number },
  additionalData?: Record<string, unknown>
) {
  return {
    adminEmail: adminUser.email,
    targetEmail: targetUser.email,
    ...(targetUser.id && { targetId: targetUser.id }),
    ...additionalData,
  };
}

