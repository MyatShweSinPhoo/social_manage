const STYLES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  SCHEDULED: { label: "Scheduled", className: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  PUBLISHING: { label: "Publishing…", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  POSTED: { label: "Posted", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  FAILED: { label: "Failed", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.DRAFT;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.className}`}
    >
      {style.label}
    </span>
  );
}
