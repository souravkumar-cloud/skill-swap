import Header from "@/components/Header";
import SiderBar from "@/components/Sidebar";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  // Extract user info from the session (Google login)
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatarUrl: session.user.image || '/default-avatar.png',
      }
    : null;

  return (
    <div>
      <SiderBar/>
      <Header user={user || undefined} />
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welcome {user?.name || "Guest"} 👋</h1>
      </main>
    </div>
  );
}
