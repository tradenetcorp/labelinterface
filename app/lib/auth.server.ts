import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import { getSession } from "./session.server";

const prisma = new PrismaClient();

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

/**
 * Get the current user from the session, or return null if not authenticated
 */
export async function getUser(request: Request): Promise<User | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const sessionId = session.get("sessionId");

  if (!sessionId) {
    return null;
  }

  const dbSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    return null;
  }

  // Check if user is still active
  if (!dbSession.user.active) {
    return null;
  }

  return {
    id: dbSession.user.id,
    email: dbSession.user.email,
    name: dbSession.user.name,
    role: dbSession.user.role,
    active: dbSession.user.active,
  };
}

/**
 * Get the current user or redirect to login
 */
export async function requireUser(request: Request): Promise<User> {
  const user = await getUser(request);

  if (!user) {
    throw redirect("/login");
  }

  return user;
}

/**
 * Get the current user, verify admin role, or redirect
 */
export async function requireAdmin(request: Request): Promise<User> {
  const user = await requireUser(request);

  if (user.role !== "admin") {
    throw redirect("/");
  }

  return user;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<string> {
  // Generate session ID
  const sessionId = crypto.randomUUID();

  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });

  return sessionId;
}

/**
 * Destroy a session
 */
export async function destroySession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  });
}

