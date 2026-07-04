interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/** 카드 선택 체크박스 등에 쓰는 공용 체크. 뉴트럴 컬러 고정 */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 select-none">
      <span
        onClick={() => onChange(!checked)}
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked ? "border-neutral-800 bg-neutral-800 text-white" : "border-neutral-300 bg-white",
        ].join(" ")}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label && <span className="text-sm text-neutral-800">{label}</span>}
    </label>
  );
}
