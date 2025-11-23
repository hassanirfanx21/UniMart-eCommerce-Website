// layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RemoveExtensionNode from "./components/RemoveExtensionNode.client";
import StripeProvider from "./components/StripeProvider"; // ✅ Client wrapper
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UniMart",
  description: "App we all needed in University Life",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=BioRhyme:wght@200..800&family=Eczar:wght@400..800&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Oswald:wght@200..700&family=Roboto:ital,wght@0,100..900;1,100..900&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var el=document.getElementById('elang_linkidin_extension'); if(el&&el.parentNode){el.parentNode.removeChild(el);} var els=document.querySelectorAll('[id^="elang_"]'); els.forEach(function(e){ if(e&&e.parentNode) e.parentNode.removeChild(e); });}catch(e){} })();`,
          }}
        />

        <RemoveExtensionNode />

        {/* Global Navbar */}
        <Navbar />

        {/* ✅ Stripe works only via client wrapper */}
        <StripeProvider>{children}</StripeProvider>
      </body>
    </html>
  );
}
