"use client";

import { useState } from "react";

type CheckData = {
  configured: boolean;
  schedulerEnabled: boolean;
  page?: { id: string; name: string; fan_count?: number };
};

export default function SettingsPage() {
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<CheckData | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  async function testConnection() {
    setChecking(true);
    setCheck(null);
    setCheckError(null);
    try {
      const res = await fetch("/api/facebook/check", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Connection failed");
      }
      setCheck(json.data);
    } catch (e) {
      setCheckError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setChecking(false);
    }
  }

  async function runDue() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/facebook/run", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed");
      }
      const d = json.data;
      setRunResult(
        d.processed === 0
          ? "No posts are due right now."
          : `Processed ${d.processed} post(s): ${d.posted} posted, ${d.failed} failed.`,
      );
    } catch (e) {
      setRunResult(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Check that your Facebook Page is connected correctly.
        </p>
      </div>

      {/* Facebook connection */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Facebook connection
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Uses <code className="rounded bg-slate-100 px-1">FACEBOOK_PAGE_ID</code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1">
              FACEBOOK_PAGE_ACCESS_TOKEN
            </code>{" "}
            from your <code className="rounded bg-slate-100 px-1">.env</code>{" "}
            file.
          </p>
        </div>

        <button
          type="button"
          onClick={testConnection}
          disabled={checking}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {checking ? "Testing…" : "Test connection"}
        </button>

        {check && !check.configured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Page ID or access token is missing. Fill them in{" "}
            <code>.env</code> and restart the server.
          </div>
        )}

        {check?.configured && check.page && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✅ Connected to <strong>{check.page.name}</strong> (ID:{" "}
            {check.page.id})
            {typeof check.page.fan_count === "number" &&
              ` · ${check.page.fan_count} followers`}
          </div>
        )}

        {checkError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            ❌ {checkError}
          </div>
        )}
      </section>

      {/* Scheduler */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Scheduler</h2>
          <p className="mt-1 text-sm text-slate-500">
            The server checks for due posts every 60 seconds. You can also run
            the check manually.
          </p>
          {check && (
            <p className="mt-2 text-sm">
              Internal scheduler:{" "}
              <strong
                className={
                  check.schedulerEnabled ? "text-emerald-600" : "text-amber-600"
                }
              >
                {check.schedulerEnabled ? "enabled" : "disabled"}
              </strong>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={runDue}
          disabled={running}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {running ? "Running…" : "Run due posts now"}
        </button>

        {runResult && (
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            {runResult}
          </p>
        )}
      </section>
    </div>
  );
}
