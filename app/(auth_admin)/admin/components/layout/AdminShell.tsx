'use client';

import { ReactNode, useState } from "react";
import clsx from "clsx";

import Header from "./Header";
import SidebarMenu from "./SidebarMenu";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-teal-50 p-3 text-neutral-primary">
      <div
        className={clsx(
          "mx-auto flex w-full max-w-[1800px] flex-col gap-4 transition-all duration-300 lg:grid",
          collapsed
            ? "lg:grid-cols-[75px_minmax(0,1fr)]"
            : "lg:grid-cols-[270px_minmax(0,1fr)]",
        )}
      >
        <SidebarMenu collapsed={collapsed} />

        <div className="flex min-w-0 flex-col gap-4">
          <Header
            collapsed={collapsed}
            onToggle={() => setCollapsed((value) => !value)}
          />
          <main className="flex min-w-0 flex-col gap-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
