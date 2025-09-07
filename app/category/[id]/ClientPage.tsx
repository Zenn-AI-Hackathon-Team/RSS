"use client";
import { useCallback, useEffect, useState } from "react";
import type { MemoItem } from "@/app/src/types/memoitem/types";
import { useAuth } from "../../../app/src/providers/AuthProvider";
import { Header } from "../../src/features/common/header/components/Header";
import { useCategoryPage } from "../../src/features/routes/category/hooks";
import CategoryViewContainer from "../../src/features/routes/category-item-list/components/CategoryViewContainer";
import { AddButton } from "../../src/features/routes/link-add/components/AddButton";

export default function ClientPage({ categoryId }: { categoryId: string }) {
	const { token, loading, user } = useAuth();
	const [items, setItems] = useState<MemoItem[]>([]);

	// アイテムリストを取得する関数
	const fetchItems = useCallback(async () => {
		if (loading || !token) return;
		const qs = new URLSearchParams({
			categoryId,
			inbox: "false",
			sort: "desc",
		});
		try {
			const response = await fetch(`/api/links?${qs.toString()}`, {
				headers: { authorization: `Bearer ${token}` },
				cache: "no-store",
			});
			if (!response.ok) throw new Error(`failed: ${response.status}`);
			const data = await response.json();
			setItems(data.items ?? []);
		} catch (error) {
			console.error("Failed to fetch items:", error);
			setItems([]);
		}
	}, [loading, token, categoryId]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	// カテゴリページ用のリンク保存フック
	const { handleSaveLink } = useCategoryPage(user, categoryId, fetchItems);

	return (
		<div>
			<Header title="カテゴリ詳細" showBack />
			<CategoryViewContainer memoitems={items} categoryId={categoryId} />
			<AddButton onSubmit={handleSaveLink} />
		</div>
	);
}
