import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import nextAuthOptions from '@/lib/nextAuth/nextAuthOptions';
import DashboardHero from "./components/DashboardHero";

const AdminPage = async () => {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    const authFrontendUrl =
      process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ??
      'http://localhost:3002';

    const purchaseFrontendUrl =
      process.env.PURCHASE_FRONTEND_URL ??
      'http://localhost:3000';

    const callbackUrl = encodeURIComponent(
      `${purchaseFrontendUrl}/admin`
    );

    redirect(
      `${authFrontendUrl}/login?view=password&callbackUrl=${callbackUrl}`
    );
  }

  if (!session.user?.is_staff) {
    redirect('/');
  }

  return (
    <div className="w-full mx-auto">
      <DashboardHero userName={session.user.name} />
      {/* <h1 className="text-3xl font-semibold">
        Administración LifeOn
      </h1>

      <div className="mt-6">
        <p>Sesión iniciada correctamente.</p>
        <p>Usuario: {session.user.username}</p>
        <p>Nombre: {session.user.name}</p>
        <p>Correo: {session.user.email}</p>
      </div> */}
    </div>
  );
};

export default AdminPage;
