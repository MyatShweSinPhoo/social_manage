// Thin wrapper around the Facebook Graph API (Page publishing only).

type FbConfig = { pageId: string; token: string; version: string };

function getConfig(): FbConfig {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const version = process.env.FACEBOOK_GRAPH_VERSION || "v27.0";

  if (!pageId || !token) {
    throw new Error(
      "FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN is not set in .env",
    );
  }
  return { pageId, token, version };
}

async function parseResponse(res: Response): Promise<Record<string, unknown>> {
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.error)) {
    const err = data?.error;
    const detail = err
      ? `${err.message}${
          err.code
            ? ` (code ${err.code}${err.error_subcode ? `/${err.error_subcode}` : ""})`
            : ""
        }`
      : `HTTP ${res.status}`;
    throw new Error(`Facebook error: ${detail}`);
  }

  return (data ?? {}) as Record<string, unknown>;
}

// Photo post: uploads the image file itself, so it also works from localhost.
export async function publishPhoto(opts: {
  caption: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<string | null> {
  const { pageId, token, version } = getConfig();

  const form = new FormData();
  form.append(
    "source",
    new Blob([new Uint8Array(opts.buffer)], { type: opts.mimeType }),
    opts.filename,
  );
  form.append("caption", opts.caption);
  form.append("published", "true");
  form.append("access_token", token);

  const res = await fetch(`https://graph.facebook.com/${version}/${pageId}/photos`, {
    method: "POST",
    body: form,
  });
  const data = await parseResponse(res);

  const id = data.post_id ?? data.id;
  return id ? String(id) : null;
}

// Text-only post.
export async function publishText(message: string): Promise<string | null> {
  const { pageId, token, version } = getConfig();

  const form = new FormData();
  form.append("message", message);
  form.append("access_token", token);

  const res = await fetch(`https://graph.facebook.com/${version}/${pageId}/feed`, {
    method: "POST",
    body: form,
  });
  const data = await parseResponse(res);

  return data.id ? String(data.id) : null;
}

// Used by the Settings page to verify the Page ID + token.
export async function checkConnection(): Promise<{
  id: string;
  name: string;
  fan_count?: number;
}> {
  const { pageId, token, version } = getConfig();

  const url = new URL(`https://graph.facebook.com/${version}/${pageId}`);
  url.searchParams.set("fields", "id,name,fan_count");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { cache: "no-store" });
  const data = await parseResponse(res);

  return {
    id: String(data.id),
    name: String(data.name ?? ""),
    fan_count: typeof data.fan_count === "number" ? data.fan_count : undefined,
  };
}
