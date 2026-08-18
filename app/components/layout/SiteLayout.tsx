'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import Header from './Header';
import Footer from './Footer';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideHeaderFooter =
    pathname === '/login' ||
    pathname?.startsWith('/dashboard') ||
    (pathname?.startsWith('/admin') ?? false);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className={clsx(!hideHeaderFooter && 'pt-16 lg:pt-0')}>
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
