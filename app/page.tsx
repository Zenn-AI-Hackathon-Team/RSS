"use client"; // ユーザー操作を扱うため、クライアントコンポーネントとして宣言

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// --- 作成したUIコンポーネントをインポート ---
// ファイルの階層に合わせて相対パスを修正
import { CategoryCard } from "./src/features/routes/CategoryCard/components/CategoryCard";
import { SearchBox } from "./src/features/routes/CategoryCard/components/SearchBox"; // SearchBoxをインポート

// --- モックデータ ---
const initialPosts = [
	{
		id: "p1",
		title: "Reactの新しい状態管理ライブラリについて",
		url: "#",
		thumbnail: "https://placehold.co/400x300/6366f1/ffffff?text=React",
		savedDate: "2025-09-03",
		categoryId: "4",
		tags: ["react", "frontend", "javascript"],
	},
	{
		id: "p2",
		title: "最高のUXを実現するためのデザイン原則10選",
		url: "#",
		thumbnail: "https://placehold.co/400x300/ec4899/ffffff?text=UX/UI",
		savedDate: "2025-09-02",
		categoryId: "1",
		tags: ["ui", "ux", "design"],
	},
	{
		id: "p3",
		title: "知らないと損する、次世代AIツールの活用法",
		url: "#",
		thumbnail: "https://placehold.co/400x300/8b5cf6/ffffff?text=AI",
		savedDate: "2025-09-04",
		categoryId: "inbox",
		tags: ["ai", "productivity"],
	},
];
const initialCategories = [
	{ id: "inbox", name: "Inbox" },
	{ id: "1", name: "仕事のアイデア" },
	{ id: "2", name: "読みたい記事" },
	{ id: "3", name: "旅行の計画" },
	{ id: "4", name: "技術メモ" },
	{ id: "5", name: "お気に入りレシピ" },
];

export default function Page() {
	const router = useRouter(); // ページ遷移用のフック

	const [posts, _setPosts] = useState(initialPosts);
	const [categories, setCategories] = useState(initialCategories);

	const onAddNewCategory = () => {
		const newCategoryName = prompt("新しいカテゴリ名:");
		if (
			newCategoryName &&
			!categories.find((c) => c.name === newCategoryName)
		) {
			setCategories([
				...categories,
				{ id: Date.now().toString(), name: newCategoryName },
			]);
		} else if (newCategoryName) {
			alert("そのカテゴリは既に存在します。");
		}
	};

	/**
	 * SearchBox内で検索結果がクリックされたときに呼び出される関数
	 * @param postId - クリックされた投稿のID
	 */
	const handleSearchResultClick = (postId: string) => {
		router.push(`/post/${postId}`);
	};

	return (
		<main className="relative min-h-screen p-4 space-y-8">
			{/* SearchBoxに投稿データ、カテゴリデータ、クリック時の処理を渡す */}
			<SearchBox
				posts={posts}
				categories={categories}
				onResultClick={handleSearchResultClick}
			/>

			<div>
				<h2 className="text-lg font-bold text-slate-800">カテゴリ</h2>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
					{categories
						.filter((c) => c.id !== "inbox")
						.map((cat) => (
							// CategoryCardコンポーネントを使用
							<CategoryCard
								key={cat.id}
								title={cat.name}
								count={posts.filter((p) => p.categoryId === cat.id).length}
								onClick={() => router.push(`/category/${cat.id}`)}
							/>
						))}
					<button
						type="button"
						className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-500"
					>
						<Plus className="w-6 h-6" />
						<p className="mt-1 text-sm font-semibold">カテゴリを追加</p>
					</button>
				</div>
			</div>
		</main>
	);
}
