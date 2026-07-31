import { ReactNode } from "react";
import type { Metadata } from "next";

import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";

import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import CartProvider from "@/providers/CartProvider";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistPoppins.variable}  antialiased`}>
        <NextAuthSessionProvider>
          <ReactQueryProvider>
            <CartProvider>
              <Header />
              <main className="pt-16 lg:pt-0">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </ReactQueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
};