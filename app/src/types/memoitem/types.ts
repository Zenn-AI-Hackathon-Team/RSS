export type Provider = "youtube" | "x" | "instagram" | "generic";
export type FetchStatus = "ok" | "partial" | "failed";

export interface MemoItem {
	id: string;
	url: string;
	title: string | null;
	description: string | null;
	imageUrl: string | null;
	categoryId: string | null;
	provider?: Provider;
	fetchStatus?: FetchStatus;
	createdAt?: string; // ISO
	updatedAt?: string; // ISO
}
