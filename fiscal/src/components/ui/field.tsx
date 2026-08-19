import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, className = "", ...props }: Props) {
  const fieldId = id ?? props.name;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={fieldId}
        className={`min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-muted ${className}`}
        {...props}
      />
      {error ? <p className="text-sm text-status-bad">{error}</p> : null}
    </div>
  );
}
