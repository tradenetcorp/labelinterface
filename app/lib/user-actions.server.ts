import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import { logActivity } from "./activity-log.server";
import { errorResponse } from "./responses.server";

const prisma = new PrismaClient();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["user", "admin"];

interface AdminUser {
  id: number;
  email: string;
}

/**
 * Validate email format
 */
function validateEmail(email: string | undefined): email is string {
  return !!email && EMAIL_REGEX.test(email);
}

/**
 * Validate role
 */
function validateRole(role: string): boolean {
  return VALID_ROLES.includes(role);
}

/**
 * Get user by ID or return error response
 */
async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Handle user creation
 */
export async function handleCreateUser(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const name = formData.get("name")?.toString().trim() || null;
  const role = formData.get("role")?.toString() || "user";
  const active = formData.get("active") === "true";

  if (!email) {
    return errorResponse("Email is required");
  }

  if (!validateEmail(email)) {
    return errorResponse("Invalid email format");
  }

  if (!validateRole(role)) {
    return errorResponse("Invalid role");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return errorResponse("User with this email already exists");
  }

  const newUser = await prisma.user.create({
    data: { email, name, role, active },
  });

  await logActivity({
    userId: adminUser.id,
    action: "user_create",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      targetEmail: email,
      targetId: newUser.id,
      targetName: name,
      targetRole: role,
      targetActive: active,
    },
    request,
  });

  return redirect("/admin/users");
}

/**
 * Handle user update
 */
export async function handleUpdateUser(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");
  const name = formData.get("name")?.toString().trim() || null;
  const role = formData.get("role")?.toString() || "user";
  const active = formData.get("active") === "true";

  if (!id) {
    return errorResponse("User ID is required");
  }

  if (!validateRole(role)) {
    return errorResponse("Invalid role");
  }

  const user = await getUserById(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  await prisma.user.update({
    where: { id },
    data: { name, role, active },
  });

  await logActivity({
    userId: adminUser.id,
    action: "user_update",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      targetEmail: user.email,
      targetId: id,
      changes: {
        name: { from: user.name, to: name },
        role: { from: user.role, to: role },
        active: { from: user.active, to: active },
      },
    },
    request,
  });

  return redirect("/admin/users");
}

/**
 * Handle user deactivation
 */
export async function handleDeactivateUser(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");

  if (!id) {
    return errorResponse("User ID is required");
  }

  if (id === adminUser.id) {
    return errorResponse("You cannot deactivate your own account");
  }

  const user = await getUserById(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  await logActivity({
    userId: adminUser.id,
    action: "user_deactivate",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      targetEmail: user.email,
      targetId: id,
    },
    request,
  });

  return redirect("/admin/users");
}

/**
 * Handle user reactivation
 */
export async function handleReactivateUser(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");

  if (!id) {
    return errorResponse("User ID is required");
  }

  const user = await getUserById(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  await prisma.user.update({
    where: { id },
    data: { active: true },
  });

  await logActivity({
    userId: adminUser.id,
    action: "user_reactivate",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      targetEmail: user.email,
      targetId: id,
    },
    request,
  });

  return redirect("/admin/users");
}

/**
 * Handle user deletion
 */
export async function handleDeleteUser(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");

  if (!id) {
    return errorResponse("User ID is required");
  }

  if (id === adminUser.id) {
    return errorResponse("You cannot delete your own account");
  }

  const user = await getUserById(id);
  if (!user) {
    return errorResponse("User not found", 404);
  }

  // Log before deleting
  await logActivity({
    userId: adminUser.id,
    action: "user_delete",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      targetEmail: user.email,
      targetId: id,
      targetName: user.name,
      targetRole: user.role,
    },
    request,
  });

  await prisma.user.delete({ where: { id } });

  return redirect("/admin/users");
}

