import path from "node:path";

// TikTok media lives in <UPLOAD_DIR>/tiktok (Facebook images are kept in <UPLOAD_DIR>/facebook).
export const uploadDir = () => path.join(path.resolve(process.env.UPLOAD_DIR ?? "./uploads"), "tiktok");
export const mediaPath = (file: string) => path.join(uploadDir(), path.basename(file));
export const publicMediaUrl = (file: string) =>
  `${(process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "")}/api/tiktok/media/${encodeURIComponent(file)}`;

export const tzOffsetMin = () => Number(process.env.TZ_OFFSET_MIN ?? 390);
export const tzName = () => process.env.TZ_NAME ?? "Asia/Yangon";

export const fmt = (d: Date | null | undefined) =>
  d ? d.toLocaleString("en-GB", { timeZone: tzName(), dateStyle: "medium", timeStyle: "short" }) : "-";

export const adminIds = () =>
  (process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
