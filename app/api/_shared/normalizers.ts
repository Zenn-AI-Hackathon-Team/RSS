export function normalizeUrl(raw: string): string {
	try {
		const u = new URL(raw);
		u.hostname = u.hostname.toLowerCase();
		const toDelete = [
			"utm_source",
			"utm_medium",
			"utm_campaign",
			"utm_term",
			"utm_content",
			"fbclid",
			"gclid",
			"ref",
		];
		for (const key of toDelete) u.searchParams.delete(key);
		if (u.searchParams.toString() === "") u.search = "";
		if (u.pathname.endsWith("/") && u.pathname !== "/") {
			u.pathname = u.pathname.replace(/\/+$/, "");
		}
		return u.toString();
	} catch {
		return raw;
	}
}

export function normalizeCategoryName(raw: string): {
	name: string;
	nameLower: string;
} {
	const name = raw.trim().replace(/\s+/g, " ");
	const nameLower = name.toLowerCase();
	return { name, nameLower };
}
