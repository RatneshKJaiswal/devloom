import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevLoom — Personal Engineering Workspace",
  description:
    "Track tasks, technical bugs, and learnings in one unified workspace with AI-assisted capture and spaced review.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#090d16] text-slate-100">
        {children}
      </body>
    </html>
  );
}
