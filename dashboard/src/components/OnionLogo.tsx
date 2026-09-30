import React from 'react';

interface OnionLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const OnionLogo: React.FC<OnionLogoProps> = ({ size = 'md', showSubtext = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-purple-950 via-purple-900 to-fuchsia-900 flex items-center justify-center text-white shadow-md shadow-purple-950/30 shrink-0 border border-purple-700/40`}
      >
        {/* Crisp vector onion icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Top sprout */}
          <path
            d="M16 2V7M16 2C16 2 13 4 13 7M16 2C16 2 19 4 19 7"
            stroke="#fbcfe8"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Outer bulb */}
          <path
            d="M16 7C10.5 7 6 12.5 6 18.5C6 24 10.5 28.5 16 28.5C21.5 28.5 26 24 26 18.5C26 12.5 21.5 7 16 7Z"
            fill="#831843"
            stroke="#fbcfe8"
            strokeWidth="1.5"
          />
          {/* Internal concentric layers */}
          <path
            d="M16 10C12.5 10 9.5 13.8 9.5 18.5C9.5 23 12.5 26.5 16 26.5C19.5 26.5 22.5 23 22.5 18.5C22.5 13.8 19.5 10 16 10Z"
            stroke="#f472b6"
            strokeWidth="1.2"
            strokeDasharray="2 1.5"
            fill="#9d174d"
          />
          <path
            d="M16 13C14 13 12.5 15.5 12.5 18.5C12.5 21.5 14 24 16 24C18 24 19.5 21.5 19.5 18.5C19.5 15.5 18 13 16 13Z"
            fill="#be185d"
          />
          <circle cx="16" cy="18.5" r="1.5" fill="#fdf2f8" />
        </svg>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-tight text-slate-900">
            OniVerse
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
            MANDI 2.0
          </span>
        </div>
        {showSubtext && (
          <p className="text-[10px] text-slate-500 font-medium tracking-tight">
            Built for DoCA • SIH PS 26031
          </p>
        )}
      </div>
    </div>
  );
};
