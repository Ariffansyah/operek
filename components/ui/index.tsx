import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-100 disabled:text-gray-400",
  accent: "bg-accent-500 text-white hover:bg-accent-600 disabled:bg-gray-100 disabled:text-gray-400",
  outline: "border border-gray-200 bg-white text-ink-900 hover:bg-gray-50",
  outlineAccent: "border border-accent-500 bg-white text-accent-600 hover:bg-accent-50",
  ghost: "text-gray-600 hover:bg-gray-100",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2",
} as const;

type ButtonBase = {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  pill?: boolean;
};

export function buttonClass({
  variant = "primary",
  size = "md",
  pill = false,
  className,
}: ButtonBase & { className?: string }) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed",
    pill ? "rounded-full" : "rounded-field",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  pill,
  className,
  ...props
}: ButtonBase & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={buttonClass({ variant, size, pill, className })}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  pill,
  className,
  ...props
}: ButtonBase & ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={buttonClass({ variant, size, pill, className })} />
  );
}

const FIELD =
  "w-full rounded-field border border-gray-200 bg-white px-4 text-sm text-ink-900 placeholder:text-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(FIELD, "h-11", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(FIELD, "py-3", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn(FIELD, "h-11 pr-10", className)} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      {...props}
      className={cn("mb-1.5 block text-xs font-semibold text-ink-900", className)}
    />
  );
}

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("rounded-card border border-gray-100 bg-white", className)}
    />
  );
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    />
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  const tone =
    condition === "Cukup Baik" || condition === "Bekas"
      ? "bg-amber-100 text-amber-700"
      : "bg-brand-500 text-white";
  return <Badge className={tone}>{condition}</Badge>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon}
      </div>
      <p className="font-bold text-ink-900">{title}</p>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
      {action}
    </div>
  );
}
