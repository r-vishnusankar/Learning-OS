import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfileByUserId } from "@/lib/profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfileByUserId(session.user.id);
  if (!profile || !["admin", "instructor", "department_head"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return <div className="density-compact">{children}</div>;
}
