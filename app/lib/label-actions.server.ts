import { redirect } from "react-router";
import { prisma } from "./prisma.server";
import { logActivity } from "./activity-log.server";
import { errorResponse } from "./responses.server";

interface AdminUser {
  id: number;
  email: string;
}

/**
 * Handle label creation
 */
export async function handleCreateLabel(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const shortcut = formData.get("shortcut")?.toString().trim().toLowerCase() || null;
  const active = formData.get("active") === "true";

  if (!name) {
    return errorResponse("Label name is required");
  }

  const existing = await prisma.label.findUnique({ where: { name } });
  if (existing) {
    return errorResponse("Label with this name already exists");
  }

  // Check for duplicate shortcut if provided
  if (shortcut) {
    const existingShortcut = await prisma.label.findFirst({
      where: { shortcut },
    });
    if (existingShortcut) {
      return errorResponse(`Shortcut "${shortcut}" is already used by "${existingShortcut.name}"`);
    }
  }

  const newLabel = await prisma.label.create({
    data: { name, description, shortcut, active },
  });

  await logActivity({
    userId: adminUser.id,
    action: "label_create",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      labelId: newLabel.id,
      labelName: name,
      shortcut,
      active,
    },
    request,
  });

  return redirect("/admin/labels");
}

/**
 * Handle label update
 */
export async function handleUpdateLabel(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const shortcut = formData.get("shortcut")?.toString().trim().toLowerCase() || null;
  const active = formData.get("active") === "true";

  if (!id) {
    return errorResponse("Label ID is required");
  }

  if (!name) {
    return errorResponse("Label name is required");
  }

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) {
    return errorResponse("Label not found", 404);
  }

  // Check for duplicate name (excluding current label)
  const duplicateName = await prisma.label.findFirst({
    where: { name, NOT: { id } },
  });
  if (duplicateName) {
    return errorResponse("Another label with this name already exists");
  }

  // Check for duplicate shortcut (excluding current label)
  if (shortcut) {
    const duplicateShortcut = await prisma.label.findFirst({
      where: { shortcut, NOT: { id } },
    });
    if (duplicateShortcut) {
      return errorResponse(`Shortcut "${shortcut}" is already used by "${duplicateShortcut.name}"`);
    }
  }

  await prisma.label.update({
    where: { id },
    data: { name, description, shortcut, active },
  });

  await logActivity({
    userId: adminUser.id,
    action: "label_update",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      labelId: id,
      changes: {
        name: { from: label.name, to: name },
        description: { from: label.description, to: description },
        shortcut: { from: label.shortcut, to: shortcut },
        active: { from: label.active, to: active },
      },
    },
    request,
  });

  return redirect("/admin/labels");
}

/**
 * Handle label deletion
 */
export async function handleDeleteLabel(
  formData: FormData,
  adminUser: AdminUser,
  request: Request
) {
  const id = parseInt(formData.get("id")?.toString() || "0");

  if (!id) {
    return errorResponse("Label ID is required");
  }

  const label = await prisma.label.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transcripts: true },
      },
    },
  });

  if (!label) {
    return errorResponse("Label not found", 404);
  }

  // Log before deleting
  await logActivity({
    userId: adminUser.id,
    action: "label_delete",
    category: "admin",
    status: "success",
    metadata: {
      adminEmail: adminUser.email,
      labelId: id,
      labelName: label.name,
      transcriptCount: label._count.transcripts,
    },
    request,
  });

  await prisma.label.delete({ where: { id } });

  return redirect("/admin/labels");
}
