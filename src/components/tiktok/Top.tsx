import PlatformSwitch from "@/components/PlatformSwitch";
import TtLogout from "./Logout";

export default function Top({ title, signOut = false }: { title: string; signOut?: boolean }) {
  return (
    <header className="tt-top">
      <div className="row1">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="tt-logo" aria-hidden>♪</span>
          <h1>{title}</h1>
        </div>
        {signOut && <TtLogout />}
      </div>
      <PlatformSwitch active="tiktok" dark />
    </header>
  );
}
