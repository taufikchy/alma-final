import type { Metadata } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import AuthSessionProvider from "./providers/AuthSessionProvider";

export const metadata: Metadata = {
  title: "ALMA - Aplikasi Layanan Manajemen Antenatal",
  description: "ALMA adalah aplikasi manajemen kesehatan ibu hamil yang membantu bidan dan pasien dalam memantau kesehatan selama masa kehamilan.",
  icons: {
    icon: '/logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="d-flex flex-column min-vh-100">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}