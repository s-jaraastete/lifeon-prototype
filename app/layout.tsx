import { ReactNode } from "react";
import type { Metadata } from "next";

import Footer from "./components/layout/Footer";

import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";


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
            <Header />
            <main>
              {children}
            </main>
            <Footer />
          </ReactQueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
};