// OGP情報の取得と簡易パース
// - HTMLから og:title/description/image と <title> を抽出
// - 画像URLは相対→絶対へ解決
// - プロバイダはドメインで判定
type Provider = "youtube" | "x" | "instagram" | "generic";
type FetchStatus = "ok" | "partial" | "failed";

export type OGPResult = {
	title: string | null;
	description: string | null;
	imageUrl: string | null;
	provider: Provider;
	fetchStatus: FetchStatus;
};

function detectProvider(url: string): Provider {
	// ドメインから提供元を推定
	try {
		const u = new URL(url);
		const h = u.hostname.toLowerCase();
		if (h.includes("youtube.com") || h === "youtu.be") return "youtube";
		if (h.includes("twitter.com") || h.includes("x.com")) return "x";
		if (h.includes("instagram.com")) return "instagram";
		return "generic";
	} catch {
		return "generic";
	}
}

function resolveUrl(
	baseUrl: string,
	maybeRelative?: string | null,
): string | null {
	// 相対URLをベースURL基準で絶対化
	if (!maybeRelative) return null;
	try {
		// Already absolute
		if (
			/^(https?:)?\/\//i.test(maybeRelative) ||
			maybeRelative.startsWith("data:")
		) {
			// If protocol-relative, resolve with base's protocol
			if (/^\/\//.test(maybeRelative)) {
				const base = new URL(baseUrl);
				return `${base.protocol}${maybeRelative}`;
			}
			return maybeRelative;
		}
		return new URL(maybeRelative, baseUrl).toString();
	} catch {
		return null;
	}
}

function extractTitle(html: string): string | null {
	// <title>タグの抽出（フォールバック用）
	const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
	if (!m) return null;
	return decodeHtml(m[1].trim()) || null;
}

function decodeHtml(s: string): string {
	// Minimal HTML entity decode
	return s
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

type MetaIndex = Record<string, string>;

function buildMetaIndex(html: string): MetaIndex {
	// <meta ...> タグから name/property と content を拾って索引化
	const idx: MetaIndex = {};
	const metaRe = /<meta\b[^>]*>/gi;
	const attrRe = /(\w[\w:-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>=]+))/gi;
	let m: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	while ((m = metaRe.exec(html)) !== null) {
		const tag = m[0];
		const attrs: Record<string, string> = {};
		let a: RegExpExecArray | null;
		// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
		while ((a = attrRe.exec(tag)) !== null) {
			const key = a[1].toLowerCase();
			const value = (a[3] ?? a[4] ?? a[5] ?? "").trim();
			attrs[key] = value;
		}
		const name = (attrs["property"] || attrs["name"] || "").toLowerCase();
		const content = attrs["content"] ?? "";
		if (name && content) {
			// Store first occurrence; prefer og:* later by lookup order
			if (!(name in idx)) idx[name] = content;
		}
	}
	return idx;
}

function pickFirst(idx: MetaIndex, keys: string[]): string | null {
	for (const k of keys) {
		const v = idx[k.toLowerCase()];
		if (v) return decodeHtml(v);
	}
	return null;
}

async function fetchYouTubeOGP(
	url: string,
	opts?: { timeoutMs?: number },
): Promise<OGPResult | null> {
	// YouTubeの oEmbed を利用して確実に title / thumbnail を取得
	// 参考: https://www.youtube.com/oembed?url=<VIDEO_URL>&format=json
	const timeoutMs = opts?.timeoutMs ?? 6000;
	let controller: AbortController | null = null;
	try {
		const endpoint = new URL("https://www.youtube.com/oembed");
		endpoint.searchParams.set("url", url);
		endpoint.searchParams.set("format", "json");

		controller = new AbortController();
		const id = setTimeout(() => controller?.abort(), timeoutMs);
		const res = await fetch(endpoint.toString(), {
			headers: { accept: "application/json" },
			redirect: "follow",
			signal: controller.signal,
		});
		clearTimeout(id);

		if (!res.ok) return null; // フォールバックへ
		const data = (await res.json()) as {
			title?: string;
			thumbnail_url?: string;
			author_name?: string;
		};
		const title = data.title ?? null;
		const imageUrl = data.thumbnail_url ?? null;
		const description = data.author_name ? `by ${data.author_name}` : null;
		const any = Boolean(title || imageUrl || description);
		return any
			? {
					title,
					description,
					imageUrl,
					provider: "youtube",
					fetchStatus: title || imageUrl ? "ok" : "partial",
				}
			: null;
	} catch {
		return null;
	} finally {
		try {
			controller?.abort();
		} catch {}
	}
}

export async function fetchOGP(
	url: string,
	opts?: { timeoutMs?: number },
): Promise<OGPResult> {
	// 指定URLへHTTP GETしてOGP情報を抽出
	const provider = detectProvider(url);
	// YouTube は oEmbed を優先（高確度・高速）
	if (provider === "youtube") {
		const y = await fetchYouTubeOGP(url, opts);
		if (y) return y;
		// 失敗時は従来のHTMLパースへフォールバック
	}
	const timeoutMs = opts?.timeoutMs ?? 6000;
	let controller: AbortController | null = null;
	try {
		// Validate URL
		const u = new URL(url);
		if (!/^https?:$/i.test(u.protocol)) throw new Error("INVALID_PROTOCOL");

		controller = new AbortController();
		const id = setTimeout(() => controller?.abort(), timeoutMs);
		const res = await fetch(u.toString(), {
			method: "GET",
			redirect: "follow",
			headers: {
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
				accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
			},
			signal: controller.signal,
		});
		clearTimeout(id);

		const ctype = (res.headers.get("content-type") || "").toLowerCase();
		const isHtml =
			ctype.includes("text/html") || ctype.includes("application/xhtml+xml");
		const body = isHtml ? await res.text() : "";

		if (!res.ok || !isHtml || !body) {
			return {
				title: null,
				description: null,
				imageUrl: null,
				provider,
				fetchStatus: "failed",
			};
		}

		const idx = buildMetaIndex(body);
		const title =
			pickFirst(idx, ["og:title", "twitter:title"]) || extractTitle(body);
		const description = pickFirst(idx, [
			"og:description",
			"description",
			"twitter:description",
		]);
		const rawImage = pickFirst(idx, [
			"og:image",
			"twitter:image",
			"twitter:image:src",
		]);
		const imageUrl = resolveUrl(u.toString(), rawImage);

		const any = Boolean(title || description || imageUrl);
		const fetchStatus: FetchStatus = any ? "ok" : "partial";

		return {
			title: title ?? null,
			description: description ?? null,
			imageUrl: imageUrl ?? null,
			provider,
			fetchStatus,
		};
	} catch {
		return {
			title: null,
			description: null,
			imageUrl: null,
			provider,
			fetchStatus: "failed",
		};
	} finally {
		try {
			controller?.abort();
		} catch {}
	}
}
