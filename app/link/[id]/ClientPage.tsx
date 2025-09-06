"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/src/features/common/header/components/Header";
import PostDetailsScreen from "@/app/src/features/routes/CategoryDetailsScreen/components/CategoryDetailsScreen";
import { useAuth } from "@/app/src/providers/AuthProvider";

type Provider = "youtube" | "x" | "instagram" | "generic";

type LinkDTO = {
	id: string;
	url: string;
	title: string | null;
	description: string | null;
	imageUrl: string | null;
	categoryId: string | null;
	provider?: Provider;
	createdAt?: string;
	updatedAt?: string;
};

type Post = {
	id: string;
	title: string;
	url: string;
	thumbnail: string;
	categoryId: string;
	tags: string[];
	provider?: Provider;
	videoId?: string | null;
	tweetId?: string | null;
};

type Category = { id: string; name: string };

export default function ClientPage({ id }: { id: string }) {
	const { token, loading } = useAuth();
	const [post, setPost] = useState<Post | null>(null);
	const [categories, setCategories] = useState<Category[]>([]);

	const authHeader = useMemo(
		() => (token ? { authorization: `Bearer ${token}` } : undefined),
		[token],
	);

	useEffect(() => {
		if (loading || !token) return;

		// fetch link detail
		(async () => {
			const res = await fetch(`/api/links/${id}`, {
				headers: { ...(authHeader as Record<string, string>) },
				cache: "no-store",
			});
			if (!res.ok) return;
			const link: LinkDTO = await res.json();

			const provider: Provider = link.provider ?? detectProvider(link.url);
			const videoId =
				provider === "youtube" ? extractYouTubeId(link.url) : null;
			const tweetId = provider === "x" ? extractTweetId(link.url) : null;

			const p: Post = {
				id: link.id,
				title: link.title ?? "タイトルなし",
				url: link.url,
				thumbnail:
					link.imageUrl ??
					"https://placehold.co/400x300/gray/white?text=No+Image",
				categoryId: link.categoryId ?? "inbox",
				tags: [],
				provider,
				videoId,
				tweetId,
			};
			setPost(p);
		})();

		// fetch categories
		(async () => {
			const res = await fetch(`/api/categories`, {
				headers: { ...(authHeader as Record<string, string>) },
				cache: "no-store",
			});
			if (!res.ok) return;
			const json = (await res.json()) as { items: Category[] };
			const cats = json.items ?? [];
			// 先頭に Inbox を追加（サーバー上は null 扱い）
			const withInbox: Category[] = [{ id: "inbox", name: "Inbox" }, ...cats];
			setCategories(withInbox);
		})();
	}, [loading, token, id, authHeader]);

	const handleCategoryChange = async (
		postId: string,
		newCategoryId: string,
	) => {
		if (!token) return;
		const res = await fetch(`/api/links/${postId}/category`, {
			method: "PATCH",
			headers: {
				"content-type": "application/json",
				...(authHeader as Record<string, string>),
			},
			body: JSON.stringify({
				categoryId: newCategoryId === "inbox" ? null : newCategoryId,
			}),
		});
		if (!res.ok) return;
		setPost((prev) => (prev ? { ...prev, categoryId: newCategoryId } : prev));
	};

	const handleTagsChange = (postId: string, newTags: string[]) => {
		setPost((prev) => (prev ? { ...prev, tags: newTags } : prev));
	};

	return (
		<div>
			<Header title="投稿の詳細" showBack={true} />
			{post ? (
				<PostDetailsScreen
					post={post}
					categories={categories}
					onCategoryChange={handleCategoryChange}
					onTagsChange={handleTagsChange}
				/>
			) : (
				<div className="p-4 text-slate-500 text-sm">
					読み込み中、または投稿が見つかりません。
				</div>
			)}
		</div>
	);
}

function detectProvider(raw: string): Provider {
	try {
		const u = new URL(raw);
		const h = u.hostname.toLowerCase();
		if (h.includes("youtube.com") || h === "youtu.be") return "youtube";
		if (h.includes("twitter.com") || h.includes("x.com")) return "x";
		if (h.includes("instagram.com")) return "instagram";
		return "generic";
	} catch {
		return "generic";
	}
}

function extractYouTubeId(raw: string): string | null {
	try {
		const u = new URL(raw);
		const host = u.hostname.toLowerCase();
		if (host === "youtu.be") {
			const id = u.pathname.split("/").filter(Boolean)[0];
			return id || null;
		}
		if (host.includes("youtube.com")) {
			// watch?v=, /embed/, /shorts/
			if (u.searchParams.get("v")) return u.searchParams.get("v");
			const parts = u.pathname.split("/").filter(Boolean);
			if (parts[0] === "embed" && parts[1]) return parts[1];
			if (parts[0] === "shorts" && parts[1]) return parts[1];
		}
		return null;
	} catch {
		return null;
	}
}

function extractTweetId(raw: string): string | null {
	try {
		const u = new URL(raw);
		// Patterns: https://twitter.com/{user}/status/{id}, https://x.com/{user}/status/{id}
		const parts = u.pathname.split("/").filter(Boolean);
		const statusIdx = parts.findIndex((p) => p === "status");
		if (statusIdx >= 0 && parts[statusIdx + 1]) return parts[statusIdx + 1];
		return null;
	} catch {
		return null;
	}
}
