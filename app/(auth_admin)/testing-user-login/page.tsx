import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import nextAuthOptions from '@/lib/nextAuth/nextAuthOptions';

// TODO: Destino temporal para usuarios que no son staff
const TestingUserLogin = async () => {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    const authFrontendUrl =
      process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ??
      'http://localhost:3002';

    const purchaseFrontendUrl =
      process.env.PURCHASE_FRONTEND_URL ??
      'http://localhost:3000';

    const callbackUrl = encodeURIComponent(
      `${purchaseFrontendUrl}/post-login`
    );

    redirect(
      `${authFrontendUrl}/login?callbackUrl=${callbackUrl}`
    );
  }

  if (session.user?.is_staff) {
    redirect('/admin');
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold">
        Prueba de acceso de usuario
      </h1>

      <div className="mt-6">
        <p>Sesión iniciada correctamente.</p>
        <p>Usuario: {session.user.username}</p>
        <p>Nombre: {session.user.name}</p>
        <p>Correo: {session.user.email}</p>
      </div>
    </div>
  );
};

export default TestingUserLogin;
