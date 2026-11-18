"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/tiktok", label: "Queue" },
  { href: "/tiktok/new", label: "New video" },
  { href: "/tiktok/accounts", label: "Accounts" },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="tt-tabs" aria-label="TikTok">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={path === t.href ? "on" : ""} aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
