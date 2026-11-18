import Link from "next/link";

// Small "Home | Facebook | TikTok" switcher used in both panels.
export default function PlatformSwitch({ active, dark = false }: { active: "facebook" | "tiktok"; dark?: boolean }) {
  const items = [
    { key: "home", href: "/", label: "Home" },
    { key: "facebook", href: "/facebook", label: "Facebook" },
    { key: "tiktok", href: "/tiktok", label: "TikTok" },
  ];
  const base = dark
    ? "rounded-full px-3 py-1 text-xs font-semibold"
    : "rounded-full px-3 py-1 text-xs font-semibold";
  const on = dark ? "bg-white text-black" : "bg-slate-900 text-white";
  const off = dark ? "text-zinc-400 hover:text-white" : "text-slate-500 hover:bg-slate-100";
  return (
    <div className="flex items-center gap-1">
      {items.map((i) => (
        <Link key={i.key} href={i.href} className={`${base} ${i.key === active ? on : off}`}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}
