import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rampart Remake",
  description: "A modern remake of the 1990 Atari Rampart arcade game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
