"use client";

import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// --- 型定義 ---
interface Post {
	id: string;
	title: string;
	thumbnail: string;
	savedDate: string;
	categoryId: string;
	tags: string[];
}
interface Category {
	id: string;
	name: string;
}
interface SearchBoxProps {
	posts: Post[];
	categories: Category[];
	onResultClick: (postId: string) => void;
}

// --- 検索結果のアイテム ---
const SearchResultItem = ({
	post,
	onClick,
}: {
	post: Post;
	onClick: () => void;
}) => (
	<div
		onClick={onClick}
		className="flex items-center space-x-4 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer"
	>
		<img
			src={post.thumbnail}
			alt={post.title}
			className="flex-shrink-0 bg-slate-200 rounded-md w-14 h-14 object-cover"
		/>
		<div className="overflow-hidden">
			<p className="font-semibold text-slate-800 truncate">{post.title}</p>
			<p className="text-slate-500 text-sm">{post.savedDate}</p>
		</div>
	</div>
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
			const postText =
				`${post.title} ${category ? category.name : ""} ${post.tags.join(" ")}`.toLowerCase();
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
			<div
				onClick={() => handleOpenChange(true)}
				className="relative flex items-center bg-slate-100 px-3 py-2 border border-input rounded-md ring-offset-background w-full h-10 text-slate-500 text-sm cursor-pointer"
			>
				<Search className="left-3 absolute w-5 h-5 text-slate-400" />
				<span className="pl-7">情報を検索...</span>
			</div>

			{/* 検索ダイアログ本体 */}
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>検索</DialogTitle>
					</DialogHeader>
					<div className="relative">
						<Search className="top-1/2 left-3 absolute w-5 h-5 text-slate-400 -translate-y-1/2" />
						<Input
							placeholder="検索キーワードを入力してください"
							className="pl-10"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="mt-2 pr-2 min-h-[10vh] max-h-[40vh] overflow-y-auto">
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
								<p className="pt-8 text-center text-slate-500">
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
