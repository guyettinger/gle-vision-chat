'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { ReactNode } from 'react';

export const Providers = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
