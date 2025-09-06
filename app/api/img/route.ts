import { NextResponse } from "next/server";

function isValidHttpUrl(raw: string) {
	try {
		const u = new URL(raw);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

function isPrivateHost(host: string) {
	const h = host.toLowerCase();
	if (
		h === "localhost" ||
		h === "127.0.0.1" ||
		h === "::1" ||
		h.startsWith("127.") ||
		h.endsWith(".local")
	)
		return true;
	// Basic RFC1918 checks by prefix string (not foolproof without DNS/IP resolution)
	if (h.startsWith("10.")) return true;
	if (h.startsWith("192.168.")) return true;
	const parts = h.split(".");
	if (parts.length >= 2 && parts[0] === "172") {
		const second = Number(parts[1]);
		if (Number.isFinite(second) && second >= 16 && second <= 31) return true;
	}
	return false;
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const url = searchParams.get("url");
	if (!url || !isValidHttpUrl(url)) {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}
	try {
		const u = new URL(url);
		if (isPrivateHost(u.hostname)) {
			return NextResponse.json({ error: "Blocked host" }, { status: 400 });
		}

		const res = await fetch(u.toString(), {
			// Do not forward credentials
			redirect: "follow",
			headers: {
				// Hint for image content; many providers ignore
				Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
			},
			// Timeout via AbortController could be added if needed
		});
		if (!res.ok) {
			return NextResponse.json(
				{ error: `Upstream ${res.status}` },
				{ status: 502 },
			);
		}
		const contentType = res.headers.get("content-type") || "image/*";
		const body = await res.arrayBuffer();
		return new NextResponse(body, {
			status: 200,
			headers: {
				"content-type": contentType,
				"cache-control": "public, max-age=86400, immutable",
			},
		});
	} catch (e) {
		return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
	}
}
