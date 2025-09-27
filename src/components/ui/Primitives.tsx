import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm">{children}</div>;
}
export function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{children}</div>;
}
export function LabeledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 block">
      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">{label}</div>
      {children}
    </label>
  );
}

export default {};
