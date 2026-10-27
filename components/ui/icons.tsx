import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand mark: a cell with an off-centre nucleus and a sequence tick. */
export function CytraMark({ size = 22, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14.2" cy="10" r="3.4" fill="var(--accent)" />
      <path d="M6.8 15.2c1.4 1.3 3.2 2 5.2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const ArrowUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19V5" />
    <path d="M6 11l6-6 6 6" />
  </Icon>
);

export const ArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Icon>
);

export const ChevronDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const Check = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const Close = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const Sun = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Icon>
);

export const Moon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
  </Icon>
);

export const Monitor = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 20h7M12 16.5V20" />
  </Icon>
);

export const Menu = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h16M4 16h16" />
  </Icon>
);

/** 原料替代 */
export const Swap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4L3.5 7.5 7 11" />
    <path d="M3.5 7.5H16a4 4 0 014 4" />
    <path d="M17 20l3.5-3.5L17 13" />
    <path d="M20.5 16.5H8a4 4 0 01-4-4" />
  </Icon>
);

/** 资质核查 */
export const Shield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" />
    <path d="M8.8 12l2.2 2.2 4.2-4.4" />
  </Icon>
);

/** 货期评估 */
export const Clock = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

/** 找厂家 */
export const Factory = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 20.5h18" />
    <path d="M4.5 20.5V10l5 3V10l5 3V6.5h5v14" />
    <path d="M8 17h1.5M12.5 17H14M17 17h.5" />
  </Icon>
);

export const Flask = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 3.5h5M10.5 3.5v5.2L5.2 18.2A1.6 1.6 0 006.6 20.5h10.8a1.6 1.6 0 001.4-2.3L13.5 8.7V3.5" />
    <path d="M7.8 14.5h8.4" />
  </Icon>
);

export const Layers = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z" />
    <path d="M3.5 12.5l8.5 4.5 8.5-4.5" />
    <path d="M3.5 16.5L12 21l8.5-4.5" />
  </Icon>
);

export const Copy = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2" />
  </Icon>
);

export const Refresh = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 12a7.5 7.5 0 11-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </Icon>
);

export const Sidebar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M9.5 4.5v15" />
  </Icon>
);

export const Edit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 012.9 0l.1.1a2 2 0 010 2.9L8.5 18.5l-4 1z" />
  </Icon>
);

export const Trash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12a1.8 1.8 0 001.8 1.5h5.8a1.8 1.8 0 001.8-1.5l.8-12" />
  </Icon>
);

export const External = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4.5h5.5V10M19.5 4.5L11 13" />
    <path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
  </Icon>
);

export const Doc = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 3.5h7l4 4v11.5a1.5 1.5 0 01-1.5 1.5h-9.5A1.5 1.5 0 015 19V5a1.5 1.5 0 011.5-1.5z" />
    <path d="M13.5 3.5v4h4M8.5 12.5h7M8.5 16h5" />
  </Icon>
);

export const Spark = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5l1.7 5.1 5.3 1.9-5.3 1.9L12 17.5l-1.7-5.1L5 10.5l5.3-1.9L12 3.5z" />
  </Icon>
);
