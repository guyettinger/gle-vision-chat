'use client';

import ThemeToggle from '@/components/ThemeToggle';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-4 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="dark:invert" />
          <span className="text-xl font-semibold">Vision Chat</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
