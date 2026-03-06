import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import { SearchProvider } from "@/context/SearchContext";
import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Smarthub Agrochain",
  description: "Powering the Future of Agriculture - A decentralized agro-ecosystem connecting farmers, investors, and consumers.",
  icons: {
    icon: "/LOGO.jpg",
  },
  openGraph: {
    title: "Smarthub Agrochain",
    description: "Powering the Future of Agriculture - A decentralized agro-ecosystem.",
    url: "https://smarthub-agrochain.com",
    siteName: "Smarthub Agrochain",
    images: [
      {
        url: "/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Smarthub Agrochain Hero",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smarthub Agrochain",
    description: "Powering the Future of Agriculture.",
    images: ["/hero-bg.jpg"],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: "light" }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased`}
        suppressHydrationWarning
      >
        <UserProvider>
          <CartProvider>
            <SearchProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </SearchProvider>
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
