"use client";

import { useRouter } from "next/navigation";

export default function TtLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
