import { Mail, Phone } from "lucide-react";

const SUPPORT = {
  email: "info@myabode.app",
  phone: "08121937619",
};

/**
 * The /maintenance page body (app/(auth)/maintenance). Sits on the (auth)
 * layout background with the card made see-through; the illustration is a crane setting the last block on an
 * unfinished floor. Turned on and off by MAINTENANCE_MODE in middleware.ts.
 */
export function MaintenanceNotice() {
  return (
    <div className="w-full max-w-94.25 mx-auto pb-16 flex flex-col items-center gap-7">
      <SiteWorks />

      <header className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold text-foreground">System undergoing maintenance</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;re upgrading Abode, so the admin dashboard is paused for now.
          Please check back soon.
        </p>
      </header>

      <div className="flex w-full flex-col items-center gap-2.5 border-t border-border pt-5">
        <p className="text-sm font-semibold text-foreground">Need us before then?</p>
        <ContactLink href={`mailto:${SUPPORT.email}`} icon={Mail}>
          {SUPPORT.email}
        </ContactLink>
        <ContactLink href={`tel:${SUPPORT.phone}`} icon={Phone}>
          {SUPPORT.phone}
        </ContactLink>
      </div>
    </div>
  );
}

function ContactLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex w-fit items-center gap-2 rounded-md text-sm text-(--auth-header-text) hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon size={16} aria-hidden />
      {children}
    </a>
  );
}

/** A building one floor short of done, and a crane lowering the last block. */
function SiteWorks() {
  const windows = [63, 81, 99].flatMap((y) => [50, 64, 78, 92].map((x) => ({ x, y })));

  return (
    <svg
      viewBox="0 0 220 120"
      role="img"
      aria-label="A crane lowering the final block onto a building"
      className="h-28 w-auto md:h-32"
    >
      <style>{`
        @keyframes abode-lower {
          from { transform: translateY(-26px); }
          to   { transform: translateY(0); }
        }
        .abode-load { animation: abode-lower 1.8s cubic-bezier(0.25, 1, 0.5, 1) 0.3s both; }
        @media (prefers-reduced-motion: reduce) {
          .abode-load { animation: none; }
        }
      `}</style>

      <defs>
        {/* Keeps the cable from poking above the jib while it travels. */}
        <clipPath id="abode-below-jib">
          <rect x="0" y="20" width="220" height="100" />
        </clipPath>
      </defs>

      {/* Ground */}
      <line x1="8" y1="112.5" x2="212" y2="112.5" stroke="var(--border)" strokeWidth="1.5" />

      {/* Finished floors */}
      <rect x="40" y="58" width="70" height="54" rx="1.5" fill="var(--auth-btn-end)" />
      {windows.map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1" fill="var(--auth-input-bg)" opacity="0.85" />
      ))}

      {/* The floor still being built */}
      <rect
        x="40.75"
        y="40.75"
        width="68.5"
        height="16.5"
        rx="1.5"
        fill="none"
        stroke="var(--auth-btn-start)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* Crane mast */}
      <g stroke="var(--muted-foreground)" strokeWidth="1.5" fill="none">
        <line x1="146" y1="112" x2="146" y2="20" />
        <line x1="154" y1="112" x2="154" y2="20" />
        <polyline points="146,112 154,100 146,88 154,76 146,64 154,52 146,40 154,28 146,20" />
      </g>

      {/* Jib, cab and counterweight */}
      <rect x="60" y="14" width="140" height="6" rx="1" fill="var(--muted-foreground)" />
      <rect x="143" y="20" width="14" height="9" rx="1" fill="var(--auth-input-placeholder)" />
      <rect x="182" y="20" width="14" height="12" rx="1" fill="var(--muted-foreground)" />

      {/* Cable, hook and the last block, lowered once */}
      <g clipPath="url(#abode-below-jib)">
        <g className="abode-load">
          <line x1="75" y1="-10" x2="75" y2="40" stroke="var(--muted-foreground)" strokeWidth="1.25" />
          <rect x="71" y="39" width="8" height="5" rx="1" fill="var(--muted-foreground)" />
          <rect x="60" y="45" width="30" height="12" rx="1.5" fill="var(--auth-btn-start)" />
        </g>
      </g>
    </svg>
  );
}
