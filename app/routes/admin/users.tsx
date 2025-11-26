import { useState } from "react";
import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../lib/auth.server";
import type { Route } from "./+types/users";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Management" },
    { name: "description", content: "Admin user management panel" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { users };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  try {
    if (intent === "create") {
      const email = formData.get("email")?.toString().toLowerCase().trim();
      const name = formData.get("name")?.toString().trim() || null;
      const role = formData.get("role")?.toString() || "user";
      const active = formData.get("active") === "true";

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return new Response(
          JSON.stringify({ error: "User with this email already exists" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await prisma.user.create({
        data: {
          email,
          name,
          role,
          active,
        },
      });

      return redirect("/admin/users");
    }

    if (intent === "update") {
      const id = parseInt(formData.get("id")?.toString() || "0");
      const name = formData.get("name")?.toString().trim() || null;
      const role = formData.get("role")?.toString() || "user";
      const active = formData.get("active") === "true";

      if (!id) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await prisma.user.update({
        where: { id },
        data: {
          name,
          role,
          active,
        },
      });

      return redirect("/admin/users");
    }

    if (intent === "deactivate") {
      const id = parseInt(formData.get("id")?.toString() || "0");

      if (!id) {
        return new Response(JSON.stringify({ error: "User ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await prisma.user.update({
        where: { id },
        data: { active: false },
      });

      return redirect("/admin/users");
    }

    return new Response(JSON.stringify({ error: "Invalid intent" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin action error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function AdminUsersPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const users = loaderData?.users || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">User Management</h1>
        <a
          href="/"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Home
        </a>
      </div>

      {actionData?.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {actionData.error}
        </div>
      )}

      {/* Create User Form */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-black">Create New User</h2>
        <form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="create" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-black mb-2"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-black mb-2"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  value="true"
                  defaultChecked
                  className="w-4 h-4"
                />
                <span className="text-sm text-black">Active</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create User
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
}

function UserRow({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
        {user.email}
      </td>
      {isEditing ? (
        <>
          <td className="px-6 py-4 whitespace-nowrap">
            <form method="post" id={`edit-form-${user.id}`}>
              <input type="hidden" name="intent" value="update" />
              <input type="hidden" name="id" value={user.id} />
              <input
                type="text"
                name="name"
                defaultValue={user.name || ""}
                className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
              />
            </form>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <select
              form={`edit-form-${user.id}`}
              name="role"
              defaultValue={user.role}
              className="w-full px-2 py-1 border border-gray-300 rounded text-black text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <label className="flex items-center gap-2">
              <input
                form={`edit-form-${user.id}`}
                type="checkbox"
                name="active"
                value="true"
                defaultChecked={user.active}
                className="w-4 h-4"
              />
              <span className="text-sm text-black">Active</span>
            </label>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <button
              type="submit"
              form={`edit-form-${user.id}`}
              className="text-blue-600 hover:underline mr-2"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
            {user.name || "-"}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
            <span
              className={`px-2 py-1 rounded text-xs ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {user.role}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <span
              className={`px-2 py-1 rounded text-xs ${
                user.active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {user.active ? "Active" : "Inactive"}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:underline mr-2"
            >
              Edit
            </button>
            {user.active && (
              <form method="post" className="inline">
                <input type="hidden" name="intent" value="deactivate" />
                <input type="hidden" name="id" value={user.id} />
                <button
                  type="submit"
                  className="text-red-600 hover:underline"
                  onClick={(e) => {
                    if (!confirm("Are you sure you want to deactivate this user?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Deactivate
                </button>
              </form>
            )}
          </td>
        </>
      )}
    </tr>
  );
}

