"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/src/providers/AuthProvider";
import { saveLink } from "@/app/src/features/routes/link-add/endpoint";

export default function QuickAddClient({ sharedUrlRaw }: { sharedUrlRaw: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "validating" }
    | { state: "auth" }
    | { state: "saving" }
    | { state: "success"; id: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  const sharedUrl = useMemo(() => {
    const u = sharedUrlRaw || "";
    try {
      if (!u) return "";
      const maybe = decodeURIComponent(u);
      const normalized = maybe.startsWith("http") ? maybe : `https://${maybe}`;
      const url = new URL(normalized);
      return url.toString();
    } catch {
      return "";
    }
  }, [sharedUrlRaw]);

  useEffect(() => {
    const run = async () => {
      if (!sharedUrl) {
        setStatus({ state: "error", message: "URLが見つかりませんでした。共有シートから開いてください。" });
        return;
      }
      setStatus({ state: "validating" });
      if (loading) return;
      if (!user) {
        setStatus({ state: "auth" });
        return;
      }
      try {
        setStatus({ state: "saving" });
        const res = await saveLink(sharedUrl, user);
        setStatus({ state: "success", id: res.id });
      } catch (e: any) {
        setStatus({ state: "error", message: e?.message ?? "保存に失敗しました" });
      }
    };
    run();
  }, [sharedUrl, user, loading]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md rounded-xl bg-white shadow border p-5 space-y-4 text-center">
        <h1 className="text-xl font-semibold">クイック追加</h1>
        {sharedUrl && (
          <p className="text-xs text-slate-500 break-all">{sharedUrl}</p>
        )}

        {status.state === "idle" || status.state === "validating" ? (
          <p className="text-slate-700">準備中…</p>
        ) : null}

        {status.state === "auth" ? (
          <div className="space-y-3">
            <p className="text-slate-700">保存にはログインが必要です。</p>
            <Button onClick={() => router.push("/login")} className="w-full">ログインへ</Button>
          </div>
        ) : null}

        {status.state === "saving" ? (
          <p className="text-slate-700">保存中…</p>
        ) : null}

        {status.state === "success" ? (
          <div className="space-y-3">
            <p className="text-green-700">保存しました！</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>ホームへ</Button>
              <Button className="flex-1" onClick={() => router.push(`/link/${status.id}`)}>詳細を開く</Button>
            </div>
          </div>
        ) : null}

        {status.state === "error" ? (
          <div className="space-y-3">
            <p className="text-red-600">{status.message}</p>
            <Button variant="outline" className="w-full" onClick={() => router.push("/")}>ホームへ戻る</Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

