import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createSession } from "../lib/auth.server";
import { commitSession, getSession } from "../lib/session.server";
import { getUser } from "../lib/auth.server";
import type { Route } from "./+types/login-password";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login with Password" },
    { name: "description", content: "Enter your password" },
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

  // Check if user exists and has a password
  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser || !dbUser.password) {
    throw redirect("/login");
  }

  return { email };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
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

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
    console.error("Password login error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to login. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function LoginPasswordPage({
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
          Enter Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Logging in as <strong>{email}</strong>
        </p>
        <form method="post" className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="Enter your password"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Use different email
          </a>
        </p>
      </div>
    </div>
  );
}

