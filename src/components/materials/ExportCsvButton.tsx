"use client";

import { Download } from "lucide-react";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))];
  return lines.join("\n");
}

export function ExportCsvButton({ rows, filename }: { rows: Record<string, unknown>[]; filename: string }) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="flex h-10 items-center gap-2 rounded-full bg-neutral-100 px-4 text-sm font-medium text-neutral-700 active:scale-95 disabled:opacity-50"
    >
      <Download className="h-4 w-4" /> Export CSV
    </button>
  );
}
