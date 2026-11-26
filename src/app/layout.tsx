import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { loadContent } from "@/content/load";
import "./globals.css";

// Checks src/content/site.json while the site is built: broken content fails the build.
loadContent();

/*
 * The Mac font (SF Pro) can't be shipped as a web font under Apple's licence,
 * so the font stack in globals.css asks for the visitor's own system font
 * first: Macs and iPhones render real SF Pro / SF Mono. Inter and Geist Mono
 * below are only the look-alike fallbacks for Windows, Android and Linux.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"], // optical sizes, like SF Pro Text vs SF Pro Display
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gideon Ibe — Full-Stack & AI Engineer",
  description:
    "Full-stack engineer and AI builder based in Port Harcourt, working globally.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
