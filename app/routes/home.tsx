import type { Route } from "./+types/home";
import { ListenCheck } from "../components/listen-check";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Label App" },
    { name: "description", content: "Listen and Check Interface" },
  ];
}

export default function Home() {
  return <ListenCheck />;
}
