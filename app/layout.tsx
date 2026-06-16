import { ReactNode } from "react";
import type { Metadata } from "next";

import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

import { Geist, Geist_Mono, Poppins, Google_Sans_Flex } from "next/font/google";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistPoppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const geistGoogleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-google-sans-flex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeOn",
  description: "Conoce nuestros módulos disponibles",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistGoogleSansFlex.variable} ${geistSans.variable} ${geistMono.variable} ${geistPoppins.variable}  antialiased`}>
        <NextAuthSessionProvider>
          <ReactQueryProvider>
            <main>
              {children}
            </main>
          </ReactQueryProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
};