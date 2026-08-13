'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import Header from './Header';
import Footer from './Footer';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  return (
    <>
      {!isAdmin && <Header />}
      <main className={clsx(!isAdmin && 'pt-16 lg:pt-0')}>
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
