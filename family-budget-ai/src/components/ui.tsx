"use client";

export function SubmitButton({
  children,
  className = "btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="submit" className={className}>
      {children}
    </button>
  );
}

export function DeleteButton({ label = "Șterge", onClick }: { label?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
    >
      {label}
    </button>
  );
}
