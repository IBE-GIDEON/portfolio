import type { ReactNode } from "react";

/* Outline icons in one consistent style (1.7 stroke, round joins, 24 box). */

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="block shrink-0"
    >
      {children}
    </svg>
  );
}

type P = { size?: number };

export const OverviewIcon = ({ size }: P) => (
  <Icon size={size}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </Icon>
);

export const FolderIcon = ({ size }: P) => (
  <Icon size={size}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </Icon>
);

export const BriefcaseIcon = ({ size }: P) => (
  <Icon size={size}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
  </Icon>
);

export const UserIcon = ({ size }: P) => (
  <Icon size={size}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.3-3.6 4.1-5.4 7.5-5.4s6.2 1.8 7.5 5.4" />
  </Icon>
);

export const MailIcon = ({ size }: P) => (
  <Icon size={size}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="M4.5 7l7.5 5.5L19.5 7" />
  </Icon>
);

export const ChevronDown = ({ size = 14 }: P) => (
  <Icon size={size}>
    <path d="M6 9.5l6 6 6-6" />
  </Icon>
);

export const ChevronRight = ({ size = 14 }: P) => (
  <Icon size={size}>
    <path d="M9.5 6l6 6-6 6" />
  </Icon>
);

export const ChevronUpDown = ({ size = 14 }: P) => (
  <Icon size={size}>
    <path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />
  </Icon>
);

export const ArrowLeft = ({ size = 16 }: P) => (
  <Icon size={size}>
    <path d="M14.5 6l-6 6 6 6" />
  </Icon>
);

export const ArrowRight = ({ size = 16 }: P) => (
  <Icon size={size}>
    <path d="M9.5 6l6 6-6 6" />
  </Icon>
);

export const SidebarIcon = ({ size = 16 }: P) => (
  <Icon size={size}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9.5 4.5v15" />
  </Icon>
);

export const GridIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
  </Icon>
);

export const ListIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />
  </Icon>
);

export const CollapseIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M4.5 4.5l5 5M19.5 4.5l-5 5M4.5 19.5l5-5M19.5 19.5l-5-5" />
  </Icon>
);

export const ExpandIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M9.5 9.5l-5-5m0 0v4m0-4h4M14.5 9.5l5-5m0 0v4m0-4h-4M9.5 14.5l-5 5m0 0v-4m0 4h4M14.5 14.5l5 5m0 0v-4m0 4h-4" />
  </Icon>
);

export const FilterIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2z" />
  </Icon>
);

export const CloseIcon = ({ size = 16 }: P) => (
  <Icon size={size}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
);

export const ExternalIcon = ({ size = 14 }: P) => (
  <Icon size={size}>
    <path d="M14 4.5h5.5V10M19.5 4.5L11 13M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5h4" />
  </Icon>
);

export const CopyIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Icon>
);

export const CheckIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const MenuIcon = ({ size = 20 }: P) => (
  <Icon size={size}>
    <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
  </Icon>
);

export const ReplayIcon = ({ size = 15 }: P) => (
  <Icon size={size}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" />
  </Icon>
);
