import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

export function Button(
  props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>
) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition hover:opacity-90 ${className}`}
    >
      {children}
    </button>
  );
}

export function Section(props: PropsWithChildren<{ className?: string }>) {
  const { className = "", children } = props;
  return <section className={`mx-auto w-full max-w-7xl px-6 ${className}`}>{children}</section>;
}
