import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { requireAdmin } from "../../lib/auth.server";
import { logActivity } from "../../lib/activity-log.server";
import { prisma } from "../../lib/prisma.server";
import type { Route } from "./+types/import";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Import Transcripts" },
    { name: "description", content: "Import transcripts from S3" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);

  await logActivity({
    userId: user.id,
    action: "view_admin_import",
    category: "page",
    status: "success",
    metadata: { email: user.email, role: user.role },
    request,
  });

  const stats = await prisma.transcript.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const total = await prisma.transcript.count();

  return {
    user,
    total,
    byStatus: stats.reduce(
      (acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

interface ImportResult {
  success?: boolean;
  message?: string;
  imported?: number;
  skipped?: number;
  total?: number;
  error?: string;
}

export default function AdminImport() {
  const { total, byStatus } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ImportResult>();
  const [showResult, setShowResult] = useState(false);

  const isLoading = fetcher.state !== "idle";
  const result = fetcher.data;

  const handleImport = () => {
    setShowResult(true);
    fetcher.submit({}, { method: "post", action: "/api/import-transcripts" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-black">Import Transcripts</h1>
        <div className="flex gap-4">
          <a href="/admin/users" className="text-sm text-blue-600 hover:underline">
            Users
          </a>
          <a href="/admin/labels" className="text-sm text-blue-600 hover:underline">
            Labels
          </a>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            Home
          </a>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-black mb-4">
          Current Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-black">{total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {byStatus.pending || 0}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {byStatus.completed || 0}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-500">
              {byStatus.skipped || 0}
            </div>
            <div className="text-sm text-gray-500">Skipped</div>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="mb-8 p-6 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-black mb-4">
          Import from Source
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Reads <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">transcriptions.jsonl</code> and creates database records for each transcript.
          Existing records (by audio key) are automatically skipped.
        </p>
        <button
          onClick={handleImport}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Importing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import from S3
            </>
          )}
        </button>
      </div>

      {/* Result Card */}
      {showResult && result && (
        <div
          className={`rounded-lg border p-6 ${
            result.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <h3
            className={`font-semibold mb-2 ${
              result.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.success ? "Import Successful" : "Import Failed"}
          </h3>
          {result.success ? (
            <div className="space-y-2 text-gray-700">
              <p>{result.message}</p>
              <div className="flex gap-6 text-sm">
                <span>
                  <span className="text-green-600 font-medium">
                    {result.imported}
                  </span>{" "}
                  imported
                </span>
                <span>
                  <span className="text-gray-500 font-medium">
                    {result.skipped}
                  </span>{" "}
                  skipped
                </span>
                <span>
                  <span className="text-gray-500 font-medium">
                    {result.total}
                  </span>{" "}
                  total in file
                </span>
              </div>
            </div>
          ) : (
            <p className="text-red-600">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

