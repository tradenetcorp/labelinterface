import { requireAdmin } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import { errorResponse } from "../../lib/responses.server";
import { prisma } from "../../lib/prisma.server";
import {
  handleCreateLabel,
  handleUpdateLabel,
  handleDeleteLabel,
} from "../../lib/label-actions.server";
import { CreateLabelForm } from "../../components/admin/create-label-form";
import { LabelsTable } from "../../components/admin/labels-table";
import type { Route } from "./+types/labels";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Label Management" },
    { name: "description", content: "Admin label management panel" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const adminUser = await requireAdmin(request);

  await logActivity({
    userId: adminUser.id,
    action: "view_admin_labels",
    category: "page",
    status: "success",
    metadata: { email: adminUser.email, role: adminUser.role },
    request,
  });

  const labels = await prisma.label.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transcripts: true },
      },
    },
  });

  return { labels };
}

export async function action({ request }: Route.ActionArgs) {
  const adminUser = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  try {
    switch (intent) {
      case "create":
        return handleCreateLabel(formData, adminUser, request);
      case "update":
        return handleUpdateLabel(formData, adminUser, request);
      case "delete":
        return handleDeleteLabel(formData, adminUser, request);
      default:
        return errorResponse("Invalid intent");
    }
  } catch (error) {
    console.error("Admin label action error:", error);
    return errorResponse("An error occurred. Please try again.", 500);
  }
}

export default function AdminLabelsPage({ loaderData, actionData }: Route.ComponentProps) {
  const labels = loaderData?.labels || [];
  const error = actionData && typeof actionData === "object" && "error" in actionData
    ? (actionData as { error: string }).error
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">Label Management</h1>
        <div className="flex gap-4">
          <a href="/admin/users" className="text-sm text-blue-600 hover:underline">
            User Management
          </a>
          <a href="/admin/logs" className="text-sm text-blue-600 hover:underline">
            Activity Logs
          </a>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <CreateLabelForm />
      <LabelsTable labels={labels} />
    </div>
  );
}
