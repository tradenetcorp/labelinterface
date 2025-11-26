import { redirect } from "react-router";
import type { Route } from "./+types/sign-in";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In" },
    { name: "description", content: "Sign in or sign up to your account" },
  ];
}

export function loader() {
  // Redirect to new login page
  throw redirect("/login");
}

