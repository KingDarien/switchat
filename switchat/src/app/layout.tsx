import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SWITCHAT",
  description:
    "SWITCHAT – a modern social platform with voice, video, and posts in a fluid three-pane feed.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>        
        <div className="min-h-screen bg-[radial-gradient(1200px_800px_at_100%_-10%,rgba(123,108,255,0.18),transparent),radial-gradient(900px_700px_at_-20%_10%,rgba(0,224,184,0.14),transparent)]">
          {children}
        </div>
      </body>
    </html>
  );
}
