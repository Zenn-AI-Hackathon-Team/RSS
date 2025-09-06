export const dynamic = "force-dynamic";
import { getServerApi } from "@/app/src/server/api";

export default async function Page() {
	const client = getServerApi();
	
	const res = await client.api.healthz.$get()

	if (!res.ok) {
		console.error("API call failed:", await res.text());
		throw new Error("Failed to fetch API");
	}
    
	const health = await res.json();

	return (
		<main className="space-y-4 p-6">
			<h1 className="font-bold text-2xl">hoge</h1>
			{/* 取得したデータを表示してみる */}
			<p>API Health Check: {health.ok ? "OK 👍" : "NG 👎"}</p>
			<a className="text-blue-600 underline" href="/api/doc" target="_blank">
				/api/doc（Swagger UI）
			</a>
		</main>
	);
}
