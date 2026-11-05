import React from 'react';

const Icon = ({ size, strokeWidth = 2.5, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const CheckIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);

export const CrossIcon = ({ size }) => (
  <Icon size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const ArrowIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ChevronIcon = ({ size = 18 }) => (
  <Icon size={size}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const CopyIcon = ({ size = 15 }) => (
  <Icon size={size} strokeWidth={2}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </Icon>
);
