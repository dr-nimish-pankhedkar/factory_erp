"use client";

import { useActionState } from "react";
import Image from "next/image";
import { User, KeyRound } from "lucide-react";
import { signInWithPin, type SignInState } from "@/lib/actions/auth";

const initialState: SignInState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInWithPin, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="mb-6 flex flex-col items-center">
        <Image src="/logo-full.png" alt="Magic Millets" width={310} height={406} priority className="w-40 h-auto" />
      </div>

      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <User className="h-4 w-4" /> Username
          </span>
          <input
            name="username"
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
            placeholder="ramesh01"
            className="h-16 rounded-2xl border border-neutral-300 bg-white px-4 text-2xl tracking-wide text-neutral-800 focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <KeyRound className="h-4 w-4" /> PIN
          </span>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            autoComplete="current-password"
            required
            placeholder="****"
            className="h-16 rounded-2xl border border-neutral-300 bg-white px-4 text-3xl tracking-[0.5em] text-neutral-800 focus:border-blue-500 focus:outline-none"
          />
        </label>

        {state.error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-16 rounded-2xl bg-blue-600 text-xl font-medium text-white active:scale-95 disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
