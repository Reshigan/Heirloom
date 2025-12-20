/**
 * Heirloom Custom Icon System
 * All icons are custom SVG - no emojis or external icon libraries
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

export type { IconProps };

const createIcon = (path: React.ReactNode, viewBox = '0 0 24 24') => {
  return ({ size = 24, className = '', strokeWidth = 1.5, fill }: IconProps) => (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill={fill || "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
};

// Brand Icons
export const Infinity = createIcon(
  <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.873 0-4.873 8 0 8 5.606 0 7.644-8 12.74-8z" />,
  '0 0 24 24'
);

export const WaxSeal = createIcon(
  <>
    <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" />
    {/* Infinity symbol instead of interlocking circles */}
    <path d="M15.5 12c2 0 2 3.2 0 3.2-2 0-2.8-3.2-5-3.2-1.9 0-1.9 3.2 0 3.2 2.2 0 3-3.2 5-3.2z" transform="translate(0, -1.6) scale(0.8)" />
  </>
);

// Navigation Icons
export const Home = createIcon(
  <>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path d="M9 22V12h6v10" />
  </>
);

export const Dashboard = createIcon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>
);

export const Image = createIcon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M21 15l-5-5L5 21" />
  </>
);

export const Pen = createIcon(
  <>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
);

export const Mic = createIcon(
  <>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10v1a7 7 0 0014 0v-1" />
    <path d="M12 18v4m-3 0h6" />
  </>
);

export const Users = createIcon(
  <>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </>
);

export const User = createIcon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 10-16 0" />
  </>
);

export const Settings = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </>
);

// Action Icons
export const Plus = createIcon(<path d="M12 5v14M5 12h14" />);

export const X = createIcon(<path d="M18 6L6 18M6 6l12 12" />);

export const Menu = createIcon(
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </>
);

export const Check = createIcon(<path d="M20 6L9 17l-5-5" strokeWidth={2} />);

export const ChevronRight = createIcon(<path d="M9 18l6-6-6-6" />);

export const ChevronLeft = createIcon(<path d="M15 18l-6-6 6-6" />);

export const ChevronDown = createIcon(<path d="M6 9l6 6 6-6" />);

export const ChevronUp = createIcon(<path d="M18 15l-6-6-6 6" />);

export const ArrowLeft = createIcon(<path d="M19 12H5M12 19l-7-7 7-7" />);

export const ArrowRight = createIcon(<path d="M5 12h14m0 0l-7-7m7 7l-7 7" />);

export const LogOut = createIcon(
  <>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
);

// Feature Icons
export const Bell = createIcon(
  <>
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </>
);

export const Shield = createIcon(
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
);

export const ShieldCheck = createIcon(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>
);

export const Lock = createIcon(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </>
);

export const KeyRound = createIcon(
  <>
    <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
    <circle cx="16.5" cy="7.5" r="2.5" />
  </>
);

export const FileKey = createIcon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <circle cx="10" cy="16" r="2" />
    <path d="M16 16h-4m2-2v4" />
  </>
);

export const Unlock = createIcon(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 019.9-1" />
  </>
);

export const Clock = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
);

export const Calendar = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>
);

export const Heart = createIcon(
  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
);

export const HeartFilled = createIcon(
  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor" />
);

export const Star = createIcon(
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
);

export const Crown = createIcon(
  <>
    <path d="M2 6l3 6 7-4 7 4 3-6" />
    <path d="M2 6v12h20V6" />
    <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
  </>
);

// Communication Icons
export const Mail = createIcon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </>
);

export const Send = createIcon(
  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
);

export const MessageCircle = createIcon(
  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
);

// Media Icons
export const Play = createIcon(
  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
);

export const PlayCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </>
);

export const Pause = createIcon(
  <>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
  </>
);

export const Stop = createIcon(
  <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="none" />
);

export const Record = createIcon(
  <circle cx="12" cy="12" r="7" fill="currentColor" stroke="none" />
);

export const VoiceWave = createIcon(
  <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 10v4M22 12h-2" />
);

// File Icons
export const Upload = createIcon(
  <>
    <path d="M12 15V3m0 0l-4 4m4-4l4 4" />
    <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" />
  </>
);

export const Download = createIcon(
  <>
    <path d="M12 3v12m0 0l4-4m-4 4l-4-4" />
    <path d="M2 17v2a2 2 0 002 2h16a2 2 0 002-2v-2" />
  </>
);

export const Save = createIcon(
  <>
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </>
);

export const Trash = createIcon(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    <path d="M10 11v6M14 11v6" />
  </>
);

export const Edit = createIcon(
  <>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>
);

export const Copy = createIcon(
  <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </>
);

// Status Icons
export const AlertTriangle = createIcon(
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
  </>
);

export const AlertCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </>
);

export const CheckCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </>
);

export const XCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </>
);

export const Info = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
  </>
);

export const Loader2 = createIcon(
  <path d="M21 12a9 9 0 11-6.219-8.56" />
);

// Misc Icons
export const Search = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
);

export const Filter = createIcon(
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
);

export const MoreHorizontal = createIcon(
  <>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
  </>
);

export const MoreVertical = createIcon(
  <>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </>
);

export const Eye = createIcon(
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>
);

export const EyeOff = createIcon(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
);

export const Gift = createIcon(
  <>
    <rect x="3" y="8" width="18" height="14" rx="2" />
    <path d="M12 8V22M3 12h18" />
    <path d="M8 8c0-2.5 1.5-6 4-6s4 3.5 4 6" />
  </>
);

export const Sparkles = createIcon(
  <>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </>
);

export const Sun = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
);

export const Moon = createIcon(
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
);

export const Family = createIcon(
  <>
    <circle cx="12" cy="5" r="3" />
    <circle cx="5" cy="19" r="2.5" />
    <circle cx="19" cy="19" r="2.5" />
    <path d="M12 8v4m0 0l-5 4.5M12 12l5 4.5" />
  </>
);

export const Quill = createIcon(
  <>
    <path d="M20 2c-2 0-6 2-9 6-2 2.5-3 5-3.5 7L6 17l1.5 1.5c2-.5 4.5-1.5 7-3.5 4-3 6-7 6-9 0-1.5-.5-3-1.5-4z" />
    <path d="M2 22l4-4" />
  </>
);

// Additional icons for remaining pages
export const Video = createIcon(
  <>
    <rect x="2" y="4" width="16" height="16" rx="2" />
    <path d="M22 8l-4 2.5v3L22 16V8z" />
  </>
);

export const Trash2 = createIcon(
  <>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    <path d="M10 11v6M14 11v6" />
  </>
);

export const Grid = createIcon(
  <>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </>
);

export const List = createIcon(
  <>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </>
);

export const Cloud = createIcon(
  <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
);

export const Droplet = createIcon(
  <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
);

export const Trophy = createIcon(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0012 0V2z" />
  </>
);

export const Leaf = createIcon(
  <>
    <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </>
);

export const Square = createIcon(
  <rect x="3" y="3" width="18" height="18" rx="2" />
);

export const Lightbulb = createIcon(
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 006 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>
);

export const RefreshCw = createIcon(
  <>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0115-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 01-15 6.7L3 16" />
  </>
);

export const Volume2 = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 010 7.07" />
    <path d="M19.07 4.93a10 10 0 010 14.14" />
  </>
);

export const VolumeX = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </>
);

export const FileText = createIcon(
  <>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </>
);

export const ArrowUp = createIcon(
  <path d="M12 19V5m0 0l-7 7m7-7l7 7" />
);

export const ArrowDown = createIcon(
  <path d="M12 5v14m0 0l7-7m-7 7l-7-7" />
);

export const Camera = createIcon(
  <>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </>
);

export const Phone = createIcon(
  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
);

export const Server = createIcon(
  <>
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </>
);

export const Share2 = createIcon(
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
);

export const TrendingUp = createIcon(
  <>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </>
);

export const Scale = createIcon(
  <>
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </>
);

export const ZoomIn = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </>
);

export const ZoomOut = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </>
);

export const CreditCard = createIcon(
  <>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </>
);

// Admin Dashboard Icons
export const BarChart3 = createIcon(
  <>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </>
);

export const Tag = createIcon(
  <>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
  </>
);

export const DollarSign = createIcon(
  <>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </>
);

export const Activity = createIcon(
  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
);

export const MessageSquare = createIcon(
  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
);

export const UserPlus = createIcon(
  <>
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </>
);

export const Zap = createIcon(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
);

// Export all icons as named exports
export const Icons = {
  Infinity,
  WaxSeal,
  Home,
  Dashboard,
  Image,
  Pen,
  Mic,
  Users,
  User,
  Settings,
  Plus,
  X,
  Menu,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Bell,
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  FileKey,
  Unlock,
  Clock,
  Calendar,
  Heart,
  HeartFilled,
  Star,
  Crown,
  Mail,
  Send,
  MessageCircle,
  Play,
  PlayCircle,
  Pause,
  Stop,
  Record,
  VoiceWave,
  Upload,
  Download,
  Save,
  Trash,
  Edit,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  Eye,
  EyeOff,
  Gift,
  Sparkles,
  Sun,
  Moon,
  Family,
  Quill,
  Video,
  Trash2,
  Grid,
  List,
  Cloud,
  Droplet,
  Trophy,
  Leaf,
  Square,
  Lightbulb,
  RefreshCw,
  Volume2,
  VolumeX,
  FileText,
  ArrowUp,
  ArrowDown,
  Camera,
  Phone,
  Server,
  Share2,
  TrendingUp,
  Scale,
  ZoomIn,
  ZoomOut,
  CreditCard,
  BarChart3,
  Tag,
  DollarSign,
  Activity,
  MessageSquare,
  UserPlus,
  Zap,
};

export default Icons;
