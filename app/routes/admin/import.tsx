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
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100">Import Transcripts</h1>
          <p className="text-gray-400 mt-1">
            Import transcripts from your S3 bucket or local JSONL file
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Current Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-100">{total}</div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {byStatus.pending || 0}
              </div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {byStatus.completed || 0}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-400">
                {byStatus.skipped || 0}
              </div>
              <div className="text-sm text-gray-400">Skipped</div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Import from Source
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Reads <code className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">transcriptions.jsonl</code> and creates database records for each transcript.
            Existing records (by audio key) are automatically skipped.
          </p>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              isLoading
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 text-white"
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
                ? "bg-green-900/20 border-green-700"
                : "bg-red-900/20 border-red-700"
            }`}
          >
            <h3
              className={`font-semibold mb-2 ${
                result.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {result.success ? "Import Successful" : "Import Failed"}
            </h3>
            {result.success ? (
              <div className="space-y-2 text-gray-300">
                <p>{result.message}</p>
                <div className="flex gap-6 text-sm">
                  <span>
                    <span className="text-green-400 font-medium">
                      {result.imported}
                    </span>{" "}
                    imported
                  </span>
                  <span>
                    <span className="text-gray-400 font-medium">
                      {result.skipped}
                    </span>{" "}
                    skipped
                  </span>
                  <span>
                    <span className="text-gray-400 font-medium">
                      {result.total}
                    </span>{" "}
                    total in file
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-red-300">{result.error}</p>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <a
            href="/"
            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to validation
          </a>
        </div>
      </div>
    </div>
  );
}

