"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  return (
    <nav className="max-w-5xl mx-auto px-4 flex items-center gap-2">
      <Link
        href="/"
        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
          isActive("/")
            ? "border-[color:var(--primary)] bg-[color:var(--surface-2)]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        Home
      </Link>
      <Link
        href="/profile"
        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
          isActive("/profile")
            ? "border-[color:var(--primary)] bg-[color:var(--surface-2)]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        Profile
      </Link>
    </nav>
  );
}