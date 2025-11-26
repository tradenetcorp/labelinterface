import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

/**
 * Generate a cryptographically secure random 6-digit OTP code
 */
export function generateOTP(): string {
  // Generate random integer between 100000 and 999999 (inclusive)
  return randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP code using bcrypt
 */
export async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Verify an OTP code against a hash
 */
export async function verifyOTP(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Create a login code for a user with 5 minute expiry
 */
export async function createLoginCode(userId: number): Promise<string> {
  const code = generateOTP();
  const codeHash = await hashOTP(code);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

  await prisma.loginCode.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  });

  return code;
}

/**
 * Verify a login code for a user
 * Returns true if valid, false otherwise
 */
export async function verifyLoginCode(
  userId: number,
  code: string
): Promise<boolean> {
  // Find the most recent unused code for this user
  const loginCode = await prisma.loginCode.findFirst({
    where: {
      userId,
      usedAt: null,
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!loginCode) {
    return false;
  }

  // Verify the code
  const isValid = await verifyOTP(code, loginCode.codeHash);

  if (isValid) {
    // Mark as used
    await prisma.loginCode.update({
      where: { id: loginCode.id },
      data: { usedAt: new Date() },
    });
  }

  return isValid;
}

