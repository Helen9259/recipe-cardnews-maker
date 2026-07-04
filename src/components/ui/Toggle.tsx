interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelOn: string;
  labelOff: string;
}

/** 화이트/다크 모드 토글 등에 쓰는 2단 토글. 뉴트럴 컬러 고정 */
export function Toggle({ checked, onChange, labelOn, labelOff }: ToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-100 p-1 text-sm font-medium">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={[
          "rounded-md px-4 py-1.5 transition-colors",
          !checked ? "bg-white text-neutral-800 shadow-sm" : "text-neutral-500",
        ].join(" ")}
      >
        {labelOff}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={[
          "rounded-md px-4 py-1.5 transition-colors",
          checked ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500",
        ].join(" ")}
      >
        {labelOn}
      </button>
    </div>
  );
}
