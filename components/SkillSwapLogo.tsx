import React from 'react';

interface SkillSwapLogoProps {
  className?: string;
  size?: number;
}

const SkillSwapLogo: React.FC<SkillSwapLogoProps> = ({ 
  className = '', 
  size = 32 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Background Circle with Gradient */}
      <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />
      
      {/* Exchange Arrows - Modern Design */}
      {/* Top Arrow (Outgoing) */}
      <path
        d="M 32 20 L 24 28 M 32 20 L 40 28 M 24 28 L 28 28 M 40 28 L 36 28"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom Arrow (Incoming) */}
      <path
        d="M 32 44 L 24 36 M 32 44 L 40 36 M 24 36 L 28 36 M 40 36 L 36 36"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Left Arrow (Outgoing) */}
      <path
        d="M 20 32 L 28 24 M 20 32 L 28 40 M 28 24 L 28 28 M 28 40 L 28 36"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Right Arrow (Incoming) */}
      <path
        d="M 44 32 L 36 24 M 44 32 L 36 40 M 36 24 L 36 28 M 36 40 L 36 36"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Central Hub Circle */}
      <circle cx="32" cy="32" r="6" fill="white" opacity="0.95" />
      <circle cx="32" cy="32" r="4" fill="url(#logoGradient)" />
    </svg>
  );
};

export default SkillSwapLogo;

