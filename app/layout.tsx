import { ReactNode } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import SiteLayout from "./components/layout/SiteLayout";

import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import CartProvider from "@/providers/CartProvider";
import nextAuthOptions from "@/lib/nextAuth/nextAuthOptions";

import { Poppins } from "next/font/google";
import "./globals.css";


const geistPoppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeOn",
  description: "Conoce nuestros módulos disponibles",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(nextAuthOptions);

  return (
    <html lang="en">
      <body className={`${geistPoppins.variable}  antialiased`}>
        <NextAuthSessionProvider session={session}>
          <ReactQueryProvider>
            <CartProvider>
              <SiteLayout>{children}</SiteLayout>
            </CartProvider>
          </ReactQueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
};
