import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import nextAuthOptions from "@/lib/nextAuth/nextAuthOptions";

const PostLoginPage = async () => {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    const authFrontendUrl =
      process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ??
      "http://localhost:3002";

    const purchaseFrontendUrl =
      process.env.PURCHASE_FRONTEND_URL ??
      "http://localhost:3000";

    const callbackUrl = encodeURIComponent(
      `${purchaseFrontendUrl}/post-login`
    );

    redirect(
      `${authFrontendUrl}/login?callbackUrl=${callbackUrl}`
    );
  }

  if (session.user?.is_staff) {
    redirect("/admin");
  }

  // Redirigir al dashboard de LifeOn
  redirect("/dashboard");
};

export default PostLoginPage;