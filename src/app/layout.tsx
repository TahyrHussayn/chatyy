import type { Metadata } from "next";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Chatyy — Flow with Chat",
  description:
    "Real-time ephemeral live chat and self-destructing secret vault with stealth security.",
  keywords: [
    "chat",
    "ephemeral chat",
    "secret vault",
    "realtime",
    "stealth lock",
  ],
  authors: [{ name: "Chatyy" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Chatyy — Flow with Chat",
    description:
      "Real-time ephemeral live chat and self-destructing secret vault with stealth security.",
    type: "website",
    siteName: "Chatyy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatyy — Flow with Chat",
    description:
      "Real-time ephemeral live chat and self-destructing secret vault with stealth security.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script>
          {
            'try{if(sessionStorage.getItem("chatyy_unlocked")==="true"){document.documentElement.classList.add("is-unlocked");}}catch(e){}'
          }
        </script>
      </head>
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
