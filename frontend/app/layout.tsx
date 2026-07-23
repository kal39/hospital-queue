// app/layout.tsx
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider"; // Using named import with curly braces
import "./globals.css";

export const metadata: Metadata = {
  title: "HospitalQueue",
  description: "Clinical Management Access Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}