import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "simBot — assistant mobile & eSIM",
  description:
    "Assistant exclusivement mobile : eSIM, forfaits data voyage, roaming, réseaux 4G/5G.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
