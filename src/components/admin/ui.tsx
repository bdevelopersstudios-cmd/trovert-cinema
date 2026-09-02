/** Small shared shells so each admin screen stays readable. */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-line/70 bg-surface p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-base text-cream sm:text-sm placeholder:text-muted/60 outline-none focus:border-tan";

export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-tan">{label}</span>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-red px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-red-bright disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full border border-line px-4 py-2 text-xs text-muted transition-colors hover:border-tan hover:text-cream ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "confirmed"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
      : status === "cancelled"
        ? "bg-red/15 text-red-bright ring-red/40"
        : "bg-tan/15 text-tan ring-tan/30";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ring-1 ${tone}`}
    >
      {status}
    </span>
  );
}
