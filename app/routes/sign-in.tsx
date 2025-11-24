import { SignIn } from '@clerk/react-router';
import type { Route } from "./+types/sign-in";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In" },
    { name: "description", content: "Sign in or sign up to your account" },
  ];
}

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* <h1 className="text-2xl font-semibold mb-6 text-center">Sign in or up</h1> */}
        <SignIn />
      </div>
    </div>
  );
}

