import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gym CRM",
  description: "Member management for the gym",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Gym CRM
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-brand-600">
                Dashboard
              </Link>
              <Link href="/members" className="hover:text-brand-600">
                Members
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
