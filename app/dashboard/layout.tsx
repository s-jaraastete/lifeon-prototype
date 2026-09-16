import SupabaseConfigGuard from "./components/SupabaseConfigGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupabaseConfigGuard>{children}</SupabaseConfigGuard>;
}
