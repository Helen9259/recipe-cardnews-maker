import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-neutral-800 text-white hover:bg-neutral-700 disabled:bg-neutral-100 disabled:text-neutral-500",
  secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 disabled:text-neutral-500",
  ghost: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800",
};

/** 사이트 전체에서 쓰는 액션 버튼. 항상 뉴트럴 컬러 고정, 메인 컬러는 절대 참조하지 않는다. */
export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        VARIANT_CLASS[variant],
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    />
  );
}
