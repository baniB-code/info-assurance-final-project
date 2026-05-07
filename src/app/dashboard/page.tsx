import { redirect } from "next/navigation";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { DashboardClient } from "@/components/dashboard-client";
import { LogoutButton } from "@/components/logout-button";
import { createUserSupabaseClient } from "@/lib/supabase";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  const token = await getAccessToken();
  if (!token) redirect("/auth");
  const userDb = createUserSupabaseClient(token);
  const [{ data: notes }, { data: activity }, { data: profile }] = await Promise.all([
    userDb
      .from("notes")
      .select("*")
      .eq("is_deleted", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    userDb
      .from("auth_activity_log")
      .select("id, event_type, details, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    userDb.from("users").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <main className="bg-[#f6f6f6]">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile?.display_name ?? user.user_metadata?.display_name ?? "User"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/profile"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
          >
            Profile
          </a>
          <LogoutButton />
        </div>
      </div>
      <DashboardClient
        webgoatUrl={env.webgoatLessonUrl}
        initialNotes={notes ?? []}
        initialActivity={activity ?? []}
      />
    </main>
  );
}
