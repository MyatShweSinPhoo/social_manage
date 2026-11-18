import { HttpError } from "@/lib/http";

export type ParsedPost = {
  caption: string;
  status: "DRAFT" | "SCHEDULED";
  scheduledAt: Date | null;
  image: File | null;
  removeImage: boolean;
};

// Reads the multipart form sent by the admin UI and validates it.
export async function parsePostForm(req: Request): Promise<ParsedPost> {
  const form = await req.formData();

  const caption = String(form.get("caption") ?? "").trim();
  const status = form.get("status") === "SCHEDULED" ? "SCHEDULED" : "DRAFT";

  const rawDate = String(form.get("scheduledAt") ?? "").trim();
  let scheduledAt: Date | null = null;
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpError(400, "Invalid schedule time");
    }
    scheduledAt = parsed;
  }

  const imageEntry = form.get("image");
  const image =
    imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

  const removeImage = form.get("removeImage") === "true";

  if (status === "SCHEDULED") {
    if (!scheduledAt) {
      throw new HttpError(400, "Please choose a date and time to schedule");
    }
    if (scheduledAt.getTime() < Date.now() - 60_000) {
      throw new HttpError(400, "The schedule time must be in the future");
    }
  }

  return { caption, status, scheduledAt, image, removeImage };
}
