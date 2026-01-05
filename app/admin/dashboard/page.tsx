import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p>Welcome Admin</p>
    </div>
  );
}
