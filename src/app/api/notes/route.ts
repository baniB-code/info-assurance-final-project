import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { noteSchema } from "@/lib/validation";
import { createUserSupabaseClient } from "@/lib/supabase";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  const url = new URL(req.url);
  const deleted = url.searchParams.get("deleted") === "true";

  const { data, error } = await supabaseUser
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", deleted)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load notes" }, { status: 400 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  try {
    const payload = noteSchema.parse(await req.json());
    const { data, error } = await supabaseUser
      .from("notes")
      .insert({
        user_id: user.id,
        title: payload.title,
        content: payload.content,
        is_pinned: payload.isPinned,
        is_archived: payload.isArchived,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: "Could not create note" }, { status: 400 });
    return NextResponse.json({ note: data });
  } catch {
    return NextResponse.json({ error: "Invalid note content" }, { status: 400 });
  }
}
