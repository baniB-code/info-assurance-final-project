"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordStrength } from "@/components/password-strength";

export function ProfileClient({
  email,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  stats,
}: {
  email: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
  stats: {
    totalNotes: number;
    pinnedNotes: number;
    archivedNotes: number;
    deletedNotes: number;
    activityEvents: number;
  };
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, bio, avatarUrl }),
    });
    const body = await res.json();
    setMessage(res.ok ? "Profile updated successfully." : body.error ?? "Failed.");
    if (res.ok) {
      void fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "PROFILE_UPDATED", details: "Profile updated" }),
      });
    }
    setLoading(false);
    if (res.ok) router.refresh();
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmNewPassword) {
      setMessage("New password and confirm password do not match.");
      return;
    }

    const meetsPasswordPolicy =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /\d/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);

    if (!meetsPasswordPolicy) {
      setMessage("Please satisfy all password criteria before changing password.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await res.json();
    setMessage(res.ok ? "Password changed successfully." : body.error ?? "Failed.");
    if (res.ok) {
      void fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "PASSWORD_CHANGED", details: "Password changed" }),
      });
    }
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setLoading(false);
  };

  const onAvatarSelected = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Avatar must be 2MB or smaller.");
      return;
    }
    void (async () => {
      setUploadingAvatar(true);
      setMessage("");
      const previousAvatarUrl = avatarUrl;
      const form = new FormData();
      form.set("file", file);
      if (previousAvatarUrl) {
        form.set("previousAvatarUrl", previousAvatarUrl);
      }
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? "Could not upload avatar.");
      } else {
        setAvatarUrl(body.url ?? "");
        setMessage("Avatar uploaded. Click Save Profile to persist.");
      }
      setUploadingAvatar(false);
    })();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-slate-500">
                {(displayName || email || "U").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">Profile Overview</h2>
            <p className="text-sm text-slate-500">{email}</p>
            <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
                disabled={uploadingAvatar}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Notes" value={stats.totalNotes} />
        <StatCard label="Pinned" value={stats.pinnedNotes} />
        <StatCard label="Archived" value={stats.archivedNotes} />
        <StatCard label="Trash" value={stats.deletedNotes} />
        <StatCard label="Activity" value={stats.activityEvents} />
      </section>

      <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Public Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Update your account identity details.</p>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short bio (optional)"
          className="mt-2 h-24 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
          maxLength={240}
        />
        <p className="mt-1 text-xs text-slate-500">{bio.length}/240</p>
        <button
          disabled={loading}
          className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          Save Profile
        </button>
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Change Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use a strong new password (8+, uppercase, lowercase, number, symbol).
        </p>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
          required
        />
        <input
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Confirm new password"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
          required
        />
        <div className="mt-3">
          <PasswordStrength password={newPassword} />
        </div>
        {confirmNewPassword && newPassword !== confirmNewPassword && (
          <p className="mt-2 text-sm text-rose-600">Passwords do not match.</p>
        )}
        <button
          disabled={loading}
          className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          Change Password
        </button>
      </form>

      {message && <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
