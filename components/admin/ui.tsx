"use client";

import { useEffect, type ReactNode } from "react";

/* --------------------------------- Card ---------------------------------- */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="surface rounded-2xl p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{label}</p>
      <p className="mt-3 font-display text-4xl text-off-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-steel">{hint}</p>}
    </div>
  );
}

/* -------------------------------- Buttons -------------------------------- */
export function AdminButton({
  children,
  variant = "primary",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary: "bg-accent text-off-white hover:shadow-[0_0_30px_-8px_rgba(212,28,4,0.55)]",
    ghost:
      "border border-[color:var(--edge-strong)] text-soft-silver hover:text-off-white",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

/* --------------------------------- Fields -------------------------------- */
const fieldCls =
  "w-full rounded-lg border border-[color:var(--edge-strong)] bg-near-black px-3.5 py-2.5 text-sm text-off-white placeholder:text-steel/50 focus:border-accent focus:outline-none";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-steel">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={`${fieldCls} ${props.className || ""}`} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`${fieldCls} resize-none ${props.className || ""}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return <select {...props} className={`${fieldCls} ${props.className || ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-soft-silver"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-graphite"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-obsidian transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  );
}

/* --------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-obsidian/85 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl surface-carbon"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--edge)] px-6 py-4">
          <h2 className="font-display text-xl tracking-wide text-off-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-steel hover:text-off-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-[color:var(--edge)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- DataTable ------------------------------- */
export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  actions,
  empty = "No records yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  actions?: (row: T) => ReactNode;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl surface px-6 py-16 text-center text-steel">
        {empty}
      </div>
    );
  }
  return (
    <div className="hide-scrollbar overflow-x-auto rounded-2xl surface">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--edge-strong)] text-xs uppercase tracking-[0.15em] text-steel">
            {columns.map((c) => (
              <th key={c.key} className="px-5 py-4 font-medium">
                {c.header}
              </th>
            ))}
            {actions && <th className="px-5 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-[color:var(--edge)] last:border-0 hover:bg-[color:var(--carbon)]"
            >
              {columns.map((c) => (
                <td key={c.key} className="px-5 py-4 text-soft-silver">
                  {c.render ? c.render(row) : ((row as any)[c.key] ?? "—")}
                </td>
              ))}
              {actions && (
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
