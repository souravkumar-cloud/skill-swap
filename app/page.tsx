// app/page.tsx

import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  // Redirect everyone to the dashboard page
  redirect("/dashboard");

  // This line will never be reached
  return null;
}
