import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOLEVA — Built for your next move",
  description: "The initial Next.js foundation for the SOLEVA shoes store.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
