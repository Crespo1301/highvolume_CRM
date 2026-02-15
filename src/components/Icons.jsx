import React from 'react';

const base = {
  display: 'inline-block',
  verticalAlign: 'middle',
};

function Svg({ children, size = 16, stroke = 'currentColor', fill = 'none', style = {}, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ ...base, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconX(props) {
  return (
    <Svg {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  );
}

export function IconPhone(props) {
  return (
    <Svg {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.06a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

export function IconCalendar(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Svg>
  );
}

export function IconPlay(props) {
  return (
    <Svg {...props} fill="currentColor" stroke="none">
      <path d="M8 5l11 7-11 7V5z" />
    </Svg>
  );
}

export function IconStop(props) {
  return (
    <Svg {...props} fill="currentColor" stroke="none">
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </Svg>
  );
}

export function IconChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Svg>
  );
}

export function IconFilter(props) {
  return (
    <Svg {...props}>
      <path d="M22 3H2l8 9v7l4 2v-9l8-9z" />
    </Svg>
  );
}

export function IconSort(props) {
  return (
    <Svg {...props}>
      <path d="M11 5h10" />
      <path d="M11 9h7" />
      <path d="M11 13h4" />
      <path d="M3 17l4 4 4-4" />
      <path d="M7 21V3" />
    </Svg>
  );
}

export function IconTarget(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </Svg>
  );
}

export function IconCheck(props) {
  return (
    <Svg {...props}>
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function IconBan(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.9 4.9l14.2 14.2" />
    </Svg>
  );
}

export function IconSkull(props) {
  return (
    <Svg {...props}>
      <path d="M12 3a7 7 0 0 0-7 7v3a4 4 0 0 0 3 3.87V20a1 1 0 0 0 1 1h1v-3h2v3h1a1 1 0 0 0 1-1v-3.13A4 4 0 0 0 19 13v-3a7 7 0 0 0-7-7z" />
      <path d="M9 11h.01" />
      <path d="M15 11h.01" />
    </Svg>
  );
}

export function IconFlag(props) {
  return (
    <Svg {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </Svg>
  );
}

export function IconGolf(props) {
  return (
    <Svg {...props}>
      <path d="M12 2v20" />
      <path d="M12 2l8 4-8 4" />
      <path d="M6 22h12" />
    </Svg>
  );
}
