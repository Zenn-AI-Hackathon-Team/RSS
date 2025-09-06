import { getServerApi } from "@/app/src/server/getServerApi";
import { Button } from "@/components/ui/button";

export default async function Page() {
  const api = getServerApi();
  // リポ準拠：api.api.healthz（2階層）
  const health = await (await api.api.healthz.$get()).json();

  return (
    <main className="space-y-4 p-6">
      <h1 className="font-bold text-2xl">リポ準拠（basePath('/api')）</h1>
      <pre>health: {JSON.stringify(health)}</pre>

      <a className="text-blue-600 underline" href="/api/doc" target="_blank">
        /api/doc（Swagger UI）
      </a>
    </main>
  );
}
