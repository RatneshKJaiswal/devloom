import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevLoom — Personal Engineering Workspace",
  description:
    "Track tasks, technical bugs, and learnings in one unified workspace with AI-assisted capture and spaced review.",
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
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t = localStorage.getItem('devloom-theme');
                var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) || !t;
                if (!isDark && t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch(e) {}
            })()`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#121316] text-slate-100">
        {children}
      </body>
    </html>
  );
}
