import { useState } from "react";
import { useSearchParams } from "react-router";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import type { Route } from "./+types/logs";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Activity Logs" },
    { name: "description", content: "View all activity logs" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const adminUser = await requireAdmin(request);

  // Log page view
  await logActivity({
    userId: adminUser.id,
    action: "view_admin_logs",
    category: "page",
    status: "success",
    metadata: { email: adminUser.email, role: adminUser.role },
    request,
  });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const category = url.searchParams.get("category") || "";
  const action = url.searchParams.get("action") || "";
  const userId = url.searchParams.get("userId") || "";

  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: {
    category?: string;
    action?: { contains: string };
    userId?: number;
  } = {};

  if (category) {
    where.category = category;
  }
  if (action) {
    where.action = { contains: action };
  }
  if (userId) {
    where.userId = parseInt(userId);
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Get unique categories for filter
  const categories = await prisma.activityLog.groupBy({
    by: ["category"],
  });

  // Get users for filter
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  });

  return {
    logs,
    total,
    page,
    totalPages,
    pageSize,
    categories: categories.map((c) => c.category),
    users,
    filters: { category, action, userId },
  };
}

export default function AdminLogsPage({ loaderData }: Route.ComponentProps) {
  const {
    logs = [],
    total = 0,
    page = 1,
    totalPages = 1,
    categories = [],
    users = [],
    filters = {},
  } = loaderData || {};

  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page when filtering
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const parseMetadata = (metadata: string | null) => {
    if (!metadata) return null;
    try {
      return JSON.parse(metadata);
    } catch {
      return metadata;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      success: "bg-green-100 text-green-800",
      failure: "bg-red-100 text-red-800",
      error: "bg-orange-100 text-orange-800",
    };
    return classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800";
  };

  const getCategoryBadge = (category: string) => {
    const classes = {
      auth: "bg-blue-100 text-blue-800",
      admin: "bg-purple-100 text-purple-800",
      page: "bg-gray-100 text-gray-800",
      transcript: "bg-yellow-100 text-yellow-800",
    };
    return classes[category as keyof typeof classes] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">Activity Logs</h1>
        <div className="flex gap-4">
          <a
            href="/admin/users"
            className="text-sm text-blue-600 hover:underline"
          >
            User Management
          </a>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Back to Home
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Category
            </label>
            <select
              value={filters.category || ""}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              User
            </label>
            <select
              value={filters.userId || ""}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Action
            </label>
            <input
              type="text"
              value={filters.action || ""}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="Search action..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="px-4 py-2 text-sm text-gray-600 hover:text-black"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {logs.length} of {total} logs
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const metadata = parseMetadata(log.metadata);
              const isExpanded = expandedRows.has(log.id);

              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                    {log.user?.email || (
                      <span className="text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-black font-mono">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getCategoryBadge(
                        log.category
                      )}`}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusBadge(
                        log.status
                      )}`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {metadata && (
                      <button
                        onClick={() => toggleRow(log.id)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {isExpanded ? "Hide" : "Show"} Details
                      </button>
                    )}
                    {isExpanded && metadata && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-w-md">
                        <pre>{JSON.stringify(metadata, null, 2)}</pre>
                        {log.ipAddress && (
                          <div className="mt-2 text-gray-600">
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    page === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

