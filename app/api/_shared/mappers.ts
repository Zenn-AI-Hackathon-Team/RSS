import type { Timestamp } from "@/lib/firebaseAdmin";

type Provider = "youtube" | "x" | "instagram" | "generic";
type FetchStatus = "ok" | "partial" | "failed";

export type LinkDoc = {
	url: string;
	title: string | null;
	description: string | null;
	imageUrl: string | null;
	categoryId: string | null;
	provider?: Provider;
	fetchStatus?: FetchStatus;
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
};

export function toLinkDTO(id: string, data: LinkDoc) {
	return {
		id,
		url: data.url,
		title: data.title ?? null,
		description: data.description ?? null,
		imageUrl: data.imageUrl ?? null,
		categoryId: data.categoryId ?? null,
		provider: data.provider ?? ("generic" as const),
		fetchStatus: data.fetchStatus ?? ("ok" as const),
		createdAt: data.createdAt
			? data.createdAt.toDate().toISOString()
			: undefined,
		updatedAt: data.updatedAt
			? data.updatedAt.toDate().toISOString()
			: undefined,
	} as const;
}

export function toCategoryDTO(
	id: string,
	data: { name: string; count?: number },
) {
	return { id, name: data.name ?? "", count: data.count };
}
