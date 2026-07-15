export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="38" y="18" width="14" height="64" rx="7" fill="currentColor" />
      <path
        d="M45 18 H58 A22 22 0 0 1 58 62 H45"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="26" y="38" width="48" height="10" rx="5" fill="currentColor" />
      <rect x="26" y="54" width="48" height="10" rx="5" fill="currentColor" />
      <path
        d="M52 82 Q64 92 74 82 T92 66"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="94" cy="63" r="5.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-primary ${className ?? ""}`}>
      <LogoMark />
      <span className="text-2xl font-semibold text-ink">PesoTrace</span>
    </span>
  );
}
