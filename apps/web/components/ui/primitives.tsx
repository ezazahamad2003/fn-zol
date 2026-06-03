import * as React from "react";
import { cn } from "@/lib/utils";

// Lightweight shadcn-style primitives. Same className API; no Radix dep.

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_hsl(222_47%_11%_/_0.04)]", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-4 border-b border-border/70", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold", className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "muted";
const BADGE: Record<BadgeVariant, string> = {
  default: "bg-sky-100 text-sky-800 border border-sky-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  danger:  "bg-rose-50 text-rose-700 border border-rose-200",
  muted:   "bg-slate-100 text-slate-600 border border-slate-200",
};
export function Badge({ variant = "default", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium", BADGE[variant], className)} {...props} />;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "default" | "sm";
}) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    default: "h-9 px-3 text-sm",
    sm:      "h-8 px-2.5 text-xs",
  };
  const variants = {
    default: "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
    outline: "border border-border bg-white shadow-sm hover:bg-slate-50",
    ghost:   "hover:bg-slate-100",
    danger:  "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  };
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-slate-600", className)} {...props} />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
      <div className="text-sm font-medium">{title}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
