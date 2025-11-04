'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import DashboardLayout from '@/components/DashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const user = session?.user
    ? {
        name: session.user.name || undefined,
        email: session.user.email || undefined,
        avatarUrl: session.user.image || undefined,
      }
    : undefined;

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}