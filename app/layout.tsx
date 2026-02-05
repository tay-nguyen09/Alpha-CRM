import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider
} from '@clerk/nextjs'
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import IsAuth from "@/components/auth/IsAuth";
import { ToastContainer } from "react-toastify";
import { StoreProvider } from "@/components/common/StoreProvider";
import FirebaseInit from "@/components/firebase/FirebaseInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alpha Net ADMIN",
  description: "Make By Alpha Net",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <StoreProvider>
          <html lang="vi">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-gray-900`} cz-shortcut-listen="true">
              <IsAuth>
                <FirebaseInit>
                  <ToastContainer position="top-right" autoClose={2000} />
                  <SidebarProvider>
                    {children}
                  </SidebarProvider>
                </FirebaseInit>
              </IsAuth>
            </body>
          </html>
        </StoreProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
