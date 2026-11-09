import { ReactNode } from "react";

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";

export default function Button({
  children, onClick, variant = "primary", disabled, type = "button", className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    ghost: "text-slate-600 hover:bg-slate-100",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
