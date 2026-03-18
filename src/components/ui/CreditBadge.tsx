"use client";

interface CreditBadgeProps {
  balance: number; // in cents
  size?: "sm" | "lg";
}

export function CreditBadge({ balance, size = "sm" }: CreditBadgeProps) {
  const dollars = (balance / 100).toFixed(2);

  return (
    <div
      className={`inline-flex items-center gap-2 bg-off-white border border-kraft rounded-none ${
        size === "lg" ? "px-5 py-3" : "px-3 py-1.5"
      }`}
    >
      <div className="w-2 h-2 rounded-full bg-success" />
      <span
        className={`font-semibold tracking-wide ${
          size === "lg" ? "text-lg" : "text-sm"
        }`}
      >
        ${dollars}
      </span>
      <span className={`text-smoky uppercase tracking-widest ${
        size === "lg" ? "text-xs" : "text-[10px]"
      }`}>
        credit
      </span>
    </div>
  );
}
