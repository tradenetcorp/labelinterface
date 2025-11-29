import { redirect } from "react-router";
import { PrismaClient } from "@prisma/client";
import { createLoginCode } from "../lib/otp.server";
import { sendOTPEmail } from "../lib/email.server";
import { getUser } from "../lib/auth.server";
import { logActivity } from "../lib/activity-log.server";
import type { Route } from "./+types/login";

const prisma = new PrismaClient();

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login" },
    { name: "description", content: "Login with email OTP" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // If already logged in, redirect to home
  const user = await getUser(request);
  if (user) {
    throw redirect("/");
  }

  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email")?.toString().toLowerCase().trim();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    await logActivity({
      action: "login_request",
      category: "auth",
      status: "failure",
      metadata: { email, reason: "invalid_email_format" },
      request,
    });
    return new Response(JSON.stringify({ error: "Invalid email format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          role: "user",
          active: true,
        },
      });
    }

    // Check if user is active
    if (!user.active) {
      await logActivity({
        userId: user.id,
        action: "login_request",
        category: "auth",
        status: "failure",
        metadata: { email, reason: "account_deactivated" },
        request,
      });
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

    // Check if user has a password (admin users)
    if (user.password) {
      await logActivity({
        userId: user.id,
        action: "login_request",
        category: "auth",
        status: "success",
        metadata: { email, method: "password", redirectedToPassword: true },
        request,
      });
      // Redirect to password login page
      return redirect(`/login-password?email=${encodeURIComponent(email)}`);
    }

    // Generate and send OTP for normal users
    const code = await createLoginCode(user.id);
    await sendOTPEmail(email, code);

    await logActivity({
      userId: user.id,
      action: "login_request",
      category: "auth",
      status: "success",
      metadata: { email, method: "otp", newUser: isNewUser },
      request,
    });

    // Redirect to verify page with email
    return redirect(`/verify?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Login error:", error);
    await logActivity({
      action: "login_request",
      category: "auth",
      status: "error",
      metadata: { email, error: error instanceof Error ? error.message : "Unknown error" },
      request,
    });
    return new Response(
      JSON.stringify({ error: "Failed to send login code. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const error = actionData && typeof actionData === 'object' && 'error' in actionData 
    ? (actionData as { error: string }).error 
    : undefined;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-center text-black">
          Sign In
        </h1>
        <form method="post" className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="your@email.com"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Send Login Code
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600 text-center">
          We'll send a 6-digit code to your email address.
        </p>
      </div>
    </div>
  );
}
