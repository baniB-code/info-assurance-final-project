"use client";

type Props = { password: string };

const checks = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "upper",
    label: "Has uppercase letter (A-Z)",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "Has lowercase letter (a-z)",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: "number",
    label: "Has number (0-9)",
    test: (v: string) => /\d/.test(v),
  },
  {
    id: "symbol",
    label: "Has special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

export function PasswordStrength({ password }: Props) {
  const passedCount = checks.filter((check) => check.test(password)).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-sm font-medium text-slate-700">
        Password criteria ({passedCount}/{checks.length})
      </p>
      <div className="space-y-1.5">
        {checks.map((check) => {
          const passed = check.test(password);
          return (
            <div key={check.id} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  passed
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                    : "border-slate-300 bg-slate-100 text-slate-500"
                }`}
              >
                {passed ? "✓" : "•"}
              </span>
              <span className={passed ? "text-emerald-700" : "text-slate-600"}>{check.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
