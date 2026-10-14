type BrandProps = { className?: string };

export function Brand({ className }: BrandProps) {
  return (
    <span className={className}>
      <svg width="31" height="31" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M5 4h7v10h8V4h7v24h-7V20h-8v8H5V4Z" fill="currentColor" />
        <path d="m5 14 7 6m8-6 7 6" stroke="var(--brand-cut, #f5f6f0)" strokeWidth="2" />
      </svg>
      <span>hourlane<span aria-hidden="true">.</span></span>
    </span>
  );
}
