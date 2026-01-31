/**
 * Hamburger Button Component
 * T115: Create HamburgerButton component
 * (Implementing early as it's needed for RulesLayout)
 */

'use client';

import { MenuIcon } from './Icons';

interface HamburgerButtonProps {
  onClick: () => void;
}

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Open navigation menu"
    >
      <MenuIcon className="w-6 h-6" />
    </button>
  );
}
