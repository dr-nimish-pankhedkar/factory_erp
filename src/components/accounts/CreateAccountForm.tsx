"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

export function CreateAccountForm({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const body = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not create account.");

      setSuccess(true);
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-700">Create account</h2>

      {allowedRoles.length > 1 && (
        <select name="role" defaultValue="staff" className="h-12 rounded-xl border border-neutral-300 px-3 text-base">
          {allowedRoles.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      )}
      {allowedRoles.length === 1 && <input type="hidden" name="role" value={allowedRoles[0]} />}

      <input name="full_name" placeholder="Full name" required className="h-12 rounded-xl border border-neutral-300 px-3 text-base" />
      <input
        name="username"
        placeholder="username"
        required
        autoCapitalize="none"
        className="h-12 rounded-xl border border-neutral-300 px-3 text-base"
      />
      <input name="phone" placeholder="Phone (optional)" className="h-12 rounded-xl border border-neutral-300 px-3 text-base" />
      <input
        name="pin"
        placeholder="4-6 digit PIN"
        inputMode="numeric"
        pattern="\d*"
        maxLength={6}
        required
        className="h-12 rounded-xl border border-neutral-300 px-3 text-base"
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Account created.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-blue-600 font-medium text-white active:scale-95 disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
