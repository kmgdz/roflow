type LogoProps = {
  className?: string;
  withWordmark?: boolean;
};

/**
 * The mark reads two ways at once: a balance (the beam between the two
 * outer nodes) and a three-node consensus graph (the triangle of lines
 * meeting at the top node) — the two ideas this project fuses.
 */
export function Logo({ className = "h-8 w-8", withWordmark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Rule of Law"
      >
        <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        <line x1="20" y1="10" x2="9" y2="24" stroke="currentColor" strokeWidth="1.4" />
        <line x1="20" y1="10" x2="31" y2="24" stroke="currentColor" strokeWidth="1.4" />
        <line x1="9" y1="24" x2="31" y2="24" stroke="currentColor" strokeWidth="1.4" />
        <line x1="20" y1="10" x2="20" y2="30" stroke="currentColor" strokeWidth="1.4" />
        <line x1="14" y1="30" x2="26" y2="30" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="20" cy="10" r="3" fill="#B8863B" />
        <circle cx="9" cy="24" r="2.4" fill="currentColor" />
        <circle cx="31" cy="24" r="2.4" fill="currentColor" />
      </svg>
      {withWordmark && (
        <span className="font-display text-lg tracking-tight text-ink">
          Rule of Law
        </span>
      )}
    </div>
  );
}
