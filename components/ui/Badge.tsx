type BadgeVariant = "scheduled" | "attended" | "absent" | "pending" | "rescheduled" | "trial" | "paket" | "pemula" | "menengah" | "lanjut";

const variantStyles: Record<BadgeVariant, string> = {
  scheduled: "bg-brand-50 text-brand-700 border-brand-100",
  attended: "bg-emerald-50 text-emerald-700 border-emerald-100",
  absent: "bg-rose-50 text-rose-600 border-rose-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  rescheduled: "bg-gray-50 text-gray-500 border-gray-100",
  trial: "bg-amber-50 text-amber-700 border-amber-100",
  paket: "bg-brand-50 text-brand-700 border-brand-100",
  pemula: "bg-sky-50 text-sky-700 border-sky-100",
  menengah: "bg-violet-50 text-violet-700 border-violet-100",
  lanjut: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
