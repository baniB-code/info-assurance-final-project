import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const AVATAR_PUBLIC_PREFIX = "/storage/v1/object/public/avatars/";

const getAvatarPathFromPublicUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(AVATAR_PUBLIC_PREFIX);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + AVATAR_PUBLIC_PREFIX.length);
    return decodeURIComponent(path);
  } catch {
    return null;
  }
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  try {
    const form = await req.formData();
    const file = form.get("file");
    const previousAvatarUrl = String(form.get("previousAvatarUrl") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing avatar file." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Avatar must be an image." }, { status: 400 });
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Avatar must be 2MB or smaller." },
        { status: 400 },
      );
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseUser.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data } = supabaseUser.storage.from("avatars").getPublicUrl(path);

    // Best-effort cleanup: remove previous avatar file when replaced.
    const previousPath = getAvatarPathFromPublicUrl(previousAvatarUrl);
    if (previousPath && previousPath.startsWith(`${user.id}/`) && previousPath !== path) {
      await supabaseUser.storage.from("avatars").remove([previousPath]);
    }

    return NextResponse.json({ url: data.publicUrl });
  } catch {
    return NextResponse.json({ error: "Could not upload avatar." }, { status: 400 });
  }
}
