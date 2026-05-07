import { AuthClient } from "@/components/auth-client";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "login";
  return <AuthClient initialMode={initialMode} />;
}
