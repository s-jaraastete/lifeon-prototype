import { getServerSession } from 'next-auth';

import nextAuthOptions from '@/lib/nextAuth/nextAuthOptions';
import DashboardHero from "./components/DashboardHero";

const AdminPage = async () => {
  const session = await getServerSession(nextAuthOptions);

  return (
    <div className="w-full mx-auto">
      <DashboardHero userName={session?.user?.name} />
    </div>
  );
};

export default AdminPage;
