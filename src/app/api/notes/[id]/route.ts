import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { noteSchema } from "@/lib/validation";
import { createUserSupabaseClient } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  const { id } = await params;
  try {
    const payload = noteSchema.partial().parse(await req.json());
    const patch = {
      title: payload.title,
      content: payload.content,
      is_pinned: payload.isPinned,
      is_archived: payload.isArchived,
    };
    const { data, error } = await supabaseUser
      .from("notes")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Could not update note" }, { status: 400 });
    return NextResponse.json({ note: data });
  } catch {
    return NextResponse.json({ error: "Invalid note content" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  const { id } = await params;
  const url = new URL(req.url);
  const permanent = url.searchParams.get("permanent") === "true";

  if (permanent) {
    await supabaseUser.from("notes").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  }

  await supabaseUser
    .from("notes")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
