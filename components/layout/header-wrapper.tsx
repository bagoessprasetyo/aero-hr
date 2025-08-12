'use client';

import { usePathname } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';

export function HeaderWrapper() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MainNav />
    </header>
  );
}