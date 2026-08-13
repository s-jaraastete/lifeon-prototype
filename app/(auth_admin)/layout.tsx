import { ReactNode } from "react";

import AdminShell from "./admin/components/layout/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
