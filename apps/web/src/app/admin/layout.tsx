"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAdminAuth } from "../../hooks/use-admin-auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAdminAuth();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isReady) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted">
        Checking admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-[2rem] border border-border bg-panel p-8">
          <h1 className="text-3xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm text-muted">
            This area expects a verified OTP session token in local storage.
          </p>
          <Link href="/admin/login" className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 font-semibold text-white">
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
