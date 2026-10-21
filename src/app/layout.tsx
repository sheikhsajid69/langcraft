import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'LangCraft — Zero-Tofu Indic DOCX-to-PDF Engine',
  description:
    'Convert Hindi, Kannada, Telugu, Tamil, and Sanskrit Word documents into pixel-perfect PDFs with zero boxes.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'LangCraft — Zero-Tofu Indic DOCX-to-PDF Engine',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-white font-sans text-[#37352F] antialiased selection:bg-[#2383E2]/20 dark:bg-[#191919] dark:text-[#D4D4D4]">
        {children}
      </body>
    </html>
  );
}
