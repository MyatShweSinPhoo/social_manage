import type { ReactNode } from "react";
import TabBar from "@/components/tiktok/TabBar";
import "./tiktok.css";

export const metadata = { title: "TikTok · Social Hub" };

export default function TikTokLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tt">
      <div className="tt-app">
        <div className="tt-scroll">{children}</div>
        <TabBar />
      </div>
    </div>
  );
}
