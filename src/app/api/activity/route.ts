import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase";
import { ACTIVITY_EVENT_TYPES, type ActivityEventType } from "@/lib/activity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  const { data } = await supabaseUser
    .from("auth_activity_log")
    .select("id, event_type, details, created_at")
    .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
    .order("created_at", { ascending: false })
    .limit(12);

  return NextResponse.json({ activity: data ?? [] });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  try {
    const body = (await req.json()) as { details?: string; eventType?: ActivityEventType };
    const details = body.details?.trim();
    const eventType = body.eventType;
    if (!details) {
      return NextResponse.json({ error: "Missing activity details" }, { status: 400 });
    }
    if (!eventType || !ACTIVITY_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Invalid activity event type" }, { status: 400 });
    }

    const { error } = await supabaseUser.from("auth_activity_log").insert({
      user_id: user.id,
      email: user.email,
      event_type: eventType,
      details,
    });

    if (error) {
      return NextResponse.json({ error: "Could not log activity" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid activity payload" }, { status: 400 });
  }
}
