"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { CategoryItem } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchBoxProps {
	posts: PostItem[];
	categories: CategoryItem[];
	onResultClick: (postId: string) => void;
}

// --- 検索結果のアイテム ---
const SearchResultItem = ({
	post,
	onClick,
}: {
	post: PostItem;
	onClick: () => void;
}) => (
	<button
		onClick={onClick}
		className="flex items-center p-2 space-x-4 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 w-full text-left"
		type="button"
	>
		<Image
			src={post.thumbnail}
			alt={post.title}
			width={56}
			height={56}
			className="flex-shrink-0 object-cover w-14 h-14 rounded-md bg-slate-200"
		/>
		<div className="overflow-hidden">
			<p className="font-semibold truncate text-slate-800">{post.title}</p>
			<p className="text-sm text-slate-500">{post.savedDate}</p>
		</div>
	</button>
);

// --- 検索ボックス本体 ---
export const SearchBox = ({
	posts,
	categories,
	onResultClick,
}: SearchBoxProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");

	// 検索ロジック
	const searchResults = useMemo(() => {
		if (!query) return [];
		const lowerCaseQuery = query.toLowerCase();
		return posts.filter((post) => {
			const category = categories.find((c) => c.id === post.categoryId);
			const postText = `${post.title} ${
				category ? category.name : ""
			}`.toLowerCase();
			return postText.includes(lowerCaseQuery);
		});
	}, [query, posts, categories]);

	const handleLinkClick = (postId: string) => {
		setIsOpen(false);
		onResultClick(postId);
	};

	// ダイアログが開いたときに、クエリをリセットする
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setQuery("");
		}
		setIsOpen(open);
	};

	return (
		<>
			{/* ダイアログを開くためのトリガー（見た目は検索ボックス） */}
			<button
				onClick={() => handleOpenChange(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleOpenChange(true);
					}
				}}
				className="relative flex h-10 w-full items-center rounded-md border border-input bg-slate-100 px-3 py-2 text-sm text-slate-500 ring-offset-background cursor-pointer text-left"
				type="button"
			>
				<Search className="absolute w-5 h-5 text-slate-400 left-3" />
				<span className="pl-7">情報を検索...</span>
			</button>

			{/* 検索ダイアログ本体 */}
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>検索</DialogTitle>
					</DialogHeader>
					<div className="relative">
						<Search className="absolute w-5 h-5 text-slate-400 left-3 top-1/2 -translate-y-1/2" />
						<Input
							placeholder="検索キーワードを入力してください"
							className="pl-10"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="mt-2 max-h-[40vh] min-h-[10vh] overflow-y-auto pr-2">
						{query && searchResults.length > 0 ? (
							<div className="space-y-1">
								{searchResults.map((post) => (
									<SearchResultItem
										key={post.id}
										post={post}
										onClick={() => handleLinkClick(post.id)}
									/>
								))}
							</div>
						) : (
							query && (
								<p className="text-center text-slate-500 pt-8">
									検索結果はありません。
								</p>
							)
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => handleOpenChange(false)}>
							キャンセル
						</Button>
						<Button type="submit" onClick={() => handleOpenChange(false)}>
							検索
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
