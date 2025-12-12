interface IconProps {
  className?: string;
  size?: number;
}

export function PartnerIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09" opacity="0.5" transform="translate(4, 0) scale(0.7)" />
    </svg>
  );
}

export function HomeIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
      <path d="M12 2v4" opacity="0.5" />
    </svg>
  );
}

export function HolidayIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L8 8H4l4 5H5l7 9 7-9h-3l4-5h-4L12 2z" />
      <rect x="10" y="20" width="4" height="2" rx="0.5" />
      <circle cx="12" cy="5" r="1" fill="currentColor" opacity="0.6" />
      <circle cx="9" cy="10" r="0.5" fill="currentColor" opacity="0.4" />
      <circle cx="15" cy="12" r="0.5" fill="currentColor" opacity="0.4" />
      <circle cx="11" cy="14" r="0.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function LightbulbIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
      <path d="M12 6v2" opacity="0.5" />
      <path d="M9.5 8.5L11 10" opacity="0.5" />
      <path d="M14.5 8.5L13 10" opacity="0.5" />
    </svg>
  );
}
