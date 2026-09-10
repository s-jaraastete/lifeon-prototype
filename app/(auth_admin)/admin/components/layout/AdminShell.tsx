'use client';

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import Header from "./Header";
import SidebarMenu from "./SidebarMenu";

type AdminShellProps = {
  children: ReactNode;
  ufValue: number | null;
};

export default function AdminShell({ children, ufValue }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="admin-scope min-h-screen bg-teal-50 px-3 text-neutral-primary">
      <div
        className={clsx(
          "mx-auto flex w-full flex-col gap-4 transition-all duration-300 lg:grid",
          collapsed
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[270px_minmax(0,1fr)]",
        )}
      >
        <div className="py-3">
          <SidebarMenu collapsed={collapsed} pathname={pathname} />
        </div>

        <div className="flex min-w-0 flex-col pb-3">
          <div className="bg-teal-50 pt-3 pb-4 rounded-2xl sticky top-0 z-30 ">
            <Header
              collapsed={collapsed}
              onToggle={() => setCollapsed((value) => !value)}
              ufValue={ufValue}
            />
          </div>
          
          <div className="flex justify-center">
            <main className="flex min-w-0 max-w-354 flex-col gap-4 w-full">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
