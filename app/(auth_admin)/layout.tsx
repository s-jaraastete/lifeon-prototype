import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import nextAuthOptions from "@/lib/nextAuth/nextAuthOptions";
import getUF from "@/utils/getUF";
import AdminShell from "./admin/components/layout/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    const authFrontendUrl =
      process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ??
      "http://localhost:3002";

    const purchaseFrontendUrl =
      process.env.PURCHASE_FRONTEND_URL ??
      "http://localhost:3000";

    const callbackUrl = encodeURIComponent(
      `${purchaseFrontendUrl}/admin`
    );

    redirect(
      `${authFrontendUrl}/login?view=password&callbackUrl=${callbackUrl}`
    );
  }

  if (!session.user?.is_staff) {
    redirect("/");
  }

  let ufValue: number | null = null;

  try {
    const ufInfo = await getUF();
    ufValue = ufInfo.value;
  } catch {
    ufValue = null;
  }

  return (
    <AdminShell ufValue={ufValue}>
      {children}
    </AdminShell>
  );
}
