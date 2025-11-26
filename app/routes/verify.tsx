import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import { verifyLoginCode } from "../lib/otp.server";
import { createSession } from "../lib/auth.server";
import { commitSession, getSession } from "../lib/session.server";
import { getUser } from "../lib/auth.server";
import type { Route } from "./+types/verify";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verify Code" },
    { name: "description", content: "Verify your login code" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // If already logged in, redirect to home
  const user = await getUser(request);
  if (user) {
    throw redirect("/");
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    throw redirect("/login");
  }

  return { email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const code = formData.get("code")?.toString().trim();

  if (!email || !code) {
    return new Response(
      JSON.stringify({ error: "Email and code are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    return new Response(JSON.stringify({ error: "Code must be 6 digits" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user.active) {
      return new Response(
        JSON.stringify({
          error: "Account is deactivated. Please contact an administrator.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify code
    const isValid = await verifyLoginCode(user.id, code);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired code. Please request a new one.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create session
    const sessionId = await createSession(user.id);

    // Set session cookie
    const session = await getSession(request.headers.get("Cookie"));
    session.set("sessionId", sessionId);
    const cookie = await commitSession(session);

    // Redirect to home
    throw redirect("/", {
      headers: {
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Verify error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to verify code. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function VerifyPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const email = loaderData?.email || "";
  const error = actionData && typeof actionData === 'object' && 'error' in actionData 
    ? (actionData as { error: string }).error 
    : undefined;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center text-black">
          Enter Verification Code
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
        <form method="post" className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-black mb-2"
            >
              Verification Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              required
              autoFocus
              maxLength={6}
              pattern="\d{6}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-center text-2xl tracking-widest"
              placeholder="000000"
              inputMode="numeric"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Verify Code
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          Didn't receive the code?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Request a new one
          </a>
        </p>
      </div>
    </div>
  );
}

