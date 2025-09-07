// InboxFetcher.tsx
"use client";

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import { client } from "@/app/src/client/api";
import type { MemoItem } from "@/app/src/types/memoitem/types";
import { useAuth } from "../../../../providers/AuthProvider";
import InboxContainer from "./InboxContainer";

function isListLinksRes(x: any): x is { items: MemoItem[] } {
	return x && Array.isArray(x.items);
}

export interface InboxFetcherRef {
	refresh: () => Promise<void>;
}

const InboxFetcher = forwardRef<InboxFetcherRef>((props, ref) => {
	const { user, loading: authLoading, getToken } = useAuth();
	const [items, setItems] = useState<MemoItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sort] = useState<"asc" | "desc">("desc");

	const fetchItems = useCallback(async () => {
		if (authLoading) return;
		setLoading(true);
		setError(null);

		try {
			if (!user) {
				setItems([]);
				setLoading(false);
				return;
			}

			const token = getToken ? await getToken() : await user.getIdToken();

			const res = await client.api.links.$get(
				{ query: { inbox: "true", sort, limit: 20 } },
				{ headers: { authorization: `Bearer ${token}` } },
			);

			const body: any = await res.json();

			if (!res.ok) {
				throw new Error(body?.message ?? "Inboxの取得に失敗しました");
			}

			if (!isListLinksRes(body)) {
				throw new Error("Unexpected response shape");
			}

			setItems(body.items ?? []);
		} catch (e: any) {
			setError(e?.message ?? "エラーが発生しました");
		} finally {
			setLoading(false);
		}
	}, [authLoading, user, getToken, sort]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	// refを通じてリフレッシュ機能を公開
	useImperativeHandle(
		ref,
		() => ({
			refresh: fetchItems,
		}),
		[fetchItems],
	);

	if (loading) return <div>読み込み中…</div>;
	if (error) return <div className="text-red-600">{error}</div>;

	return <InboxContainer memoitems={items} />;
});

InboxFetcher.displayName = "InboxFetcher";

export default InboxFetcher;
