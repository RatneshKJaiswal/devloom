import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevLoom — Personal Engineering Workspace",
  description:
    "Track tasks, technical bugs, and learnings in one unified workspace with AI-assisted capture and engineering knowledge base.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen bg-slate-950 text-slate-100"
      >
        {children}
      </body>
    </html>
  );
}
