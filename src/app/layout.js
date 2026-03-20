import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import DottedSurface from "../components/ui/dotted-surface";
import ThemeToggle from "../components/ui/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Startup Idea Validator",
  description: "Validate your startup idea with real news and AI analysis",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning is required for next-themes —
    // it modifies the class attribute on <html> in the browser after SSR
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {/* Animated dot background — sits behind everything */}
          <DottedSurface />
          {/* Page content */}
          {children}
          {/* Fixed bottom-left theme and color scheme toggle */}
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
