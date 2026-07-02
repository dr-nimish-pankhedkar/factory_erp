"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, UserX, UserCheck } from "lucide-react";
import { RoleBadge } from "@/components/layout/RoleBadge";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function AccountRow({ account, canManage }: { account: Profile; canManage: boolean }) {
  const router = useRouter();
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResetPin() {
    if (!/^\d{4,6}$/.test(pin)) {
      setMessage("Enter a 4-6 digit PIN.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const result = await res.json();
      setMessage(result.error ?? "PIN updated.");
      if (res.ok) {
        setShowPinInput(false);
        setPin("");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleToggleActive() {
    setPending(true);
    try {
      await fetch(`/api/accounts/${account.id}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !account.is_active }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        {account.photo_url ? (
          <Image src={account.photo_url} alt={account.full_name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600">
            {account.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <span className={`font-medium ${account.is_active ? "text-neutral-800" : "text-neutral-400 line-through"}`}>
            {account.full_name}
          </span>
          <span className="text-xs text-neutral-400">@{account.username}</span>
        </div>
        <RoleBadge role={account.role} />
      </div>

      {canManage && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPinInput((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-700 active:scale-95"
          >
            <KeyRound className="h-3.5 w-3.5" /> Reset PIN
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={pending}
            className="flex h-9 items-center gap-1.5 rounded-full bg-neutral-100 px-3 text-xs font-medium text-neutral-700 active:scale-95 disabled:opacity-50"
          >
            {account.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            {account.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      )}

      {showPinInput && (
        <div className="flex items-center gap-2">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            placeholder="New PIN"
            className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
          />
          <button
            type="button"
            onClick={handleResetPin}
            disabled={pending}
            className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white disabled:opacity-60"
          >
            Save
          </button>
        </div>
      )}
      {message && <p className="text-xs text-neutral-500">{message}</p>}
    </div>
  );
}
