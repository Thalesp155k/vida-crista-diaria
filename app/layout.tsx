import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vida Cristã Diária — Pr. Madson Marinho",
  description: "Sermões gratuitos do Pr. Madson Marinho e vídeos do canal Vida Cristã Diária.",
  icons: {
    icon: "/assets/channel-logo.jpg",
    shortcut: "/assets/channel-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
