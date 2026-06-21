import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  ekgColor?: string;
}

/**
 * VitalVision brand mark: cyan eye + corner focus brackets + green EKG.
 * Eye/brackets render as currentColor; pass a Tailwind text-* class.
 */
export const Logo: React.FC<LogoProps> = ({
  className = "text-ai-cyan",
  size,
  ekgColor = "#10E5A6",
}) => (
  <svg
    viewBox="0 0 120 80"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    className={className}
    style={size ? { width: size, height: (size * 80) / 120 } : undefined}
    aria-hidden="true"
  >
    <g
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 4 14 V 4 H 14" />
      <path d="M 106 4 H 116 V 14" />
      <path d="M 4 66 V 76 H 14" />
      <path d="M 106 76 H 116 V 66" />
    </g>
    <path
      d="M 18 40 C 36 18, 84 18, 102 40 C 84 62, 36 62, 18 40 Z"
      stroke="currentColor"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="60" cy="40" r="11" stroke="currentColor" strokeWidth="3.2" />
    <path
      d="M 51 40 H 55 L 57 34 L 59 46 L 61 33 L 63 47 L 65 40 H 69"
      stroke={ekgColor}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
