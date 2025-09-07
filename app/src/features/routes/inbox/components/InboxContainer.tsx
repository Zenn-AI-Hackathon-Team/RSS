// InboxContainer.tsx
"use client";
import type React from "react";
import { useState } from "react";
import type { MemoItem } from "../../../../types/memoitem/types";
import InboxHeader from "./InboxHeader";
import InboxList from "./InboxList";

type Props = { memoitems: MemoItem[] };

const InboxContainer: React.FC<Props> = ({ memoitems }) => {
	const [sortBy, setSortBy] = useState<string>("newest");
	const [items, setItems] = useState<MemoItem[]>([...memoitems]);

	// createdAt / updatedAt が無い時も落ちないように数値へ変換
	const toTime = (x: MemoItem) => {
		const iso = x.createdAt ?? x.updatedAt ?? null;
		return iso ? Date.parse(iso) : 0; // 無い場合は 0（最古扱い）
	};

	const handleSort = (value: string) => {
		setSortBy(value);
		const sorted = [...items];
		switch (value) {
			case "newest":
				sorted.sort((a, b) => toTime(b) - toTime(a));
				break;
			case "oldest":
				sorted.sort((a, b) => toTime(a) - toTime(b));
				break;
		}
		setItems(sorted);
	};

	return (
		<div className="w-full mx-auto pt-6 min-h-screen">
			<InboxHeader sortBy={sortBy} onSortChange={handleSort} />
			<InboxList items={items} />
		</div>
	);
};

export default InboxContainer;
