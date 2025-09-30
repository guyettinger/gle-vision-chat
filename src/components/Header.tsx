'use client';

import ThemeToggle from '@/components/ThemeToggle';
import { Glasses } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-4 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Glasses />
          <span className="text-xl font-semibold">Vision Chat</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
