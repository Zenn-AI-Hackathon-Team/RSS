export const dynamic = "force-dynamic";
import { getServerApi } from "@/app/src/server/getServerApi";

export default async function Page() {
	const api = getServerApi();
	const health = await (await api.api.healthz.$get()).json();

  // 呼び方のサンプル
  const sample = await api.api.healthz.$get();

	return (
		<main className="space-y-4 p-6">
			<h1 className="font-bold text-2xl">リポ準拠（basePath('/api')）</h1>
			<a className="text-blue-600 underline" href="/api/doc" target="_blank">
				/api/doc（Swagger UI）
			</a>
		</main>
	);
}
