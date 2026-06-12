import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Forme — Coach sportif IA",
  description: "Analyse tes séances Strava et reçois des conseils coaching personnalisés par IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppHeader />
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
