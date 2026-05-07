import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { ProfileClient } from "@/components/profile-client";
import { createUserSupabaseClient } from "@/lib/supabase";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const token = await getAccessToken();
  if (!token) redirect("/auth");
  const userDb = createUserSupabaseClient(token);
  const [{ data: profile }, { count: totalNotes }, { count: pinnedNotes }, { count: archivedNotes }, { count: deletedNotes }, { count: activityEvents }] = await Promise.all([
    userDb
      .from("users")
      .select("display_name, bio, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    userDb.from("notes").select("*", { count: "exact", head: true }).eq("is_deleted", false),
    userDb
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_pinned", true),
    userDb
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("is_deleted", false)
      .eq("is_archived", true),
    userDb.from("notes").select("*", { count: "exact", head: true }).eq("is_deleted", true),
    userDb.from("auth_activity_log").select("*", { count: "exact", head: true }),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-[#f6f6f6] px-6 py-10">
      <Link href="/dashboard" className="text-sm text-cyan-600">
        Back to Dashboard
      </Link>
      <h1 className="mt-3 text-5xl font-bold text-slate-900">Profile Settings</h1>
      <p className="mb-6 text-xl text-slate-500">{user.email}</p>
      <ProfileClient
        email={user.email ?? ""}
        initialDisplayName={profile?.display_name ?? user.user_metadata?.display_name ?? ""}
        initialBio={profile?.bio ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? ""}
        stats={{
          totalNotes: totalNotes ?? 0,
          pinnedNotes: pinnedNotes ?? 0,
          archivedNotes: archivedNotes ?? 0,
          deletedNotes: deletedNotes ?? 0,
          activityEvents: activityEvents ?? 0,
        }}
      />
    </main>
  );
}
