// components/Logo.jsx
// The LinkGraveyard brand mark: a broken chain link stamped on an archival
// brass plaque. Warm amber on dark, deep plum-friendly amber that also
// works on the light paper theme.

export default function Logo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="LinkGraveyard logo"
      role="img"
    >
      {/* brass plaque */}
      <rect x="2" y="2" width="36" height="36" rx="7" fill="#D9A441" />
      {/* inner plate line — like an engraved catalog plate */}
      <rect x="6.5" y="6.5" width="27" height="27" rx="4.5" stroke="#1A1408" strokeOpacity="0.35" strokeWidth="1.5" />
      {/* broken chain link */}
      <path
        d="M14.5 20.5l2.6-2.6a4.24 4.24 0 016 6l-2.6 2.6"
        stroke="#1A1408"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M25.5 19.5l-2.6 2.6a4.24 4.24 0 01-6-6l2.6-2.6"
        stroke="#1A1408"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* the gap in the link = the broken part */}
      <line x1="19.5" y1="16" x2="20.5" y2="24" stroke="#D9A441" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
