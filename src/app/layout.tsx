import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LangCraft | Zero-Tofu Indic DOCX to PDF Engine",
  description:
    "Production-grade DOCX-to-PDF conversion engine eliminating tofu (.notdef) glyph corruption across Hindi, Kannada, Telugu, Tamil, and Sanskrit.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📜</text></svg>",
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-full antialiased bg-white dark:bg-[#191919] text-[#37352F] dark:text-[#D4D4D4] font-sans selection:bg-[#2383E2]/20">
        {children}
      </body>
    </html>
  );
}
