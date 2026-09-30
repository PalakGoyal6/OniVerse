import React from 'react';
import logoIcon from '../assets/oniverse-icon.png';
import logoFull from '../assets/oniverse-logo.png';

interface OnionLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
  variant?: 'auto' | 'icon' | 'full';
  className?: string;
}

export const OnionLogo: React.FC<OnionLogoProps> = ({
  size = 'md',
  showSubtext = true,
  variant = 'auto',
  className = '',
}) => {
  const iconSizes = {
    sm: 'h-8 w-auto max-w-[36px]',
    md: 'h-10 w-auto max-w-[44px]',
    lg: 'h-12 w-auto max-w-[56px]',
    xl: 'h-16 w-auto max-w-[72px]',
  };

  const fullSizes = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
    xl: 'h-20 w-auto',
  };

  if (variant === 'full') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={logoFull}
          alt="OniVerse Logo"
          className={`${fullSizes[size]} object-contain drop-shadow-md`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src={logoIcon}
          alt="OniVerse Logo Icon"
          className={`${iconSizes[size]} object-contain drop-shadow-md transition-transform hover:scale-105 duration-200`}
        />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-950 via-purple-900 to-amber-700 bg-clip-text text-transparent">
            OniVerse
          </span>
          <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 shadow-sm">
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

