/**
 * Heirloom Custom Icon System
 * All icons are custom SVG - no emojis or external icon libraries
 */

import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const createIcon = (path: React.ReactNode, viewBox = '0 0 24 24') => {
  return ({ size = 24, className = '', strokeWidth = 1.5 }: IconProps) => (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
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
    <path d="M15 10c1.3 0 1.3 2 0 2-1.3 0-1.8-2-3.2-2-1.2 0-1.2 2 0 2 1.4 0 1.9-2 3.2-2z" />
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
};

export default Icons;
