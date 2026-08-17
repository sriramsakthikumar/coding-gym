import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Bespoke Geometric SVG Logo Icon */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-b from-[#22242c] to-[#14151a] border border-zinc-700/70 p-1 flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer isometric hex / shield facet */}
          <path
            d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z"
            stroke="#52525b"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-zinc-600"
          />

          {/* Left code bracket '<' */}
          <path
            d="M9 9.5L6.5 12L9 14.5"
            stroke="#e4e4e7"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right code bracket '>' */}
          <path
            d="M15 9.5L17.5 12L15 14.5"
            stroke="#e4e4e7"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central gym weight core dot */}
          <circle
            cx="12"
            cy="12"
            r="1.5"
            fill="#a1a1aa"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-zinc-100 ${textSizes[size]}`}>
            Code<span className="text-zinc-400 font-medium">Gym</span>
          </span>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 hidden sm:inline-block">
            Practice
          </span>
        </div>
      )}
    </div>
  );
};
