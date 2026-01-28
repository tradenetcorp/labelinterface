import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import { errorResponse } from "../../lib/responses.server";
import {
  handleCreateUser,
  handleUpdateUser,
  handleDeactivateUser,
  handleReactivateUser,
  handleDeleteUser,
} from "../../lib/user-actions.server";
import { CreateUserForm } from "../../components/admin/create-user-form";
import { UsersTable } from "../../components/admin/users-table";
import type { Route } from "./+types/users";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Management" },
    { name: "description", content: "Admin user management panel" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const adminUser = await requireAdmin(request);

  await logActivity({
    userId: adminUser.id,
    action: "view_admin_users",
    category: "page",
    status: "success",
    metadata: { email: adminUser.email, role: adminUser.role },
    request,
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { users, currentUserId: adminUser.id };
}

export async function action({ request }: Route.ActionArgs) {
  const adminUser = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  try {
    switch (intent) {
      case "create":
        return handleCreateUser(formData, adminUser, request);
      case "update":
        return handleUpdateUser(formData, adminUser, request);
      case "deactivate":
        return handleDeactivateUser(formData, adminUser, request);
      case "reactivate":
        return handleReactivateUser(formData, adminUser, request);
      case "delete":
        return handleDeleteUser(formData, adminUser, request);
      default:
        return errorResponse("Invalid intent");
    }
  } catch (error) {
    console.error("Admin action error:", error);
    return errorResponse("An error occurred. Please try again.", 500);
  }
}

export default function AdminUsersPage({ loaderData, actionData }: Route.ComponentProps) {
  const users = loaderData?.users || [];
  const currentUserId = loaderData?.currentUserId || 0;
  const error = actionData && typeof actionData === "object" && "error" in actionData
    ? (actionData as { error: string }).error
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">User Management</h1>
        <div className="flex gap-4">
          <a href="/admin/labels" className="text-sm text-blue-600 hover:underline">
            Labels
          </a>
          <a href="/admin/import" className="text-sm text-blue-600 hover:underline">
            Import
          </a>
          {/* <a href="/admin/logs" className="text-sm text-blue-600 hover:underline">
            Activity Logs
          </a> */}
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Home
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <CreateUserForm />
      <UsersTable users={users} currentUserId={currentUserId} />
    </div>
  );
}
