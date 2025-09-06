"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/app/src/features/common/header/components/Header";
import PostDetailsScreen from "@/app/src/features/routes/CategoryDetailsScreen/components/CategoryDetailsScreen";
import { useAuth } from "@/app/src/providers/AuthProvider";

type LinkDTO = {
	id: string;
	url: string;
	title: string | null;
	description: string | null;
	imageUrl: string | null;
	categoryId: string | null;
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

			const p: Post = {
				id: link.id,
				title: link.title ?? "タイトルなし",
				url: link.url,
				thumbnail:
					link.imageUrl ??
					"https://placehold.co/400x300/gray/white?text=No+Image",
				categoryId: link.categoryId ?? "inbox",
				tags: [],
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
