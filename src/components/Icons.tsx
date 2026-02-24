import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LyricsIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M9 9v2" />
    <path d="M11 9v2" />
    <path d="M14 9v2" />
    <path d="M16 9v2" />
  </svg>
);

export const ABIcon = ({ className, active }: { className?: string, active?: boolean }) => (
  <div className={cn(
    "flex items-center justify-center font-black text-[10px] border-2 rounded px-1 min-w-[24px] h-5 transition-colors",
    active ? "bg-emerald-500 border-emerald-500 text-black" : "border-current",
    className
  )}>
    AB
  </div>
);
