import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CategoryItem } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { createNewCategory, saveLinkAndTransform } from "./endpoint";

// モックデータ
const initialPosts: PostItem[] = [
	{
		id: "p1",
		title: "Reactの新しい状態管理ライブラリについて",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-03",
		categoryId: "4",
	},
	{
		id: "p2",
		title: "最高のUXを実現するためのデザイン原則10選",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-02",
		categoryId: "1",
	},
	{
		id: "p3",
		title: "知らないと損する、次世代AIツールの活用法",
		url: "#",
		thumbnail:
			"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop&crop=center",
		savedDate: "2025-09-04",
		categoryId: "inbox",
	},
];

const initialCategories: CategoryItem[] = [
	{ id: "inbox", name: "Inbox" },
	{ id: "1", name: "仕事のアイデア" },
	{ id: "2", name: "読みたい記事" },
	{ id: "3", name: "旅行の計画" },
	{ id: "4", name: "技術メモ" },
	{ id: "5", name: "お気に入りレシピ" },
];

/**
 * 投稿管理のカスタムフック
 */
export const usePosts = () => {
	const [posts, setPosts] = useState<PostItem[]>(initialPosts);

	const addPost = (newPost: PostItem) => {
		setPosts((prevPosts) => [...prevPosts, newPost]);
	};

	return {
		posts,
		addPost,
	};
};

/**
 * カテゴリ管理のカスタムフック
 */
export const useCategories = () => {
	const [categories, setCategories] =
		useState<CategoryItem[]>(initialCategories);

	const handleAddNewCategory = () => {
		const newCategoryName = prompt("新しいカテゴリ名:");
		if (!newCategoryName) return;

		try {
			const updatedCategories = createNewCategory(categories, newCategoryName);
			setCategories(updatedCategories);
		} catch (error) {
			alert(
				error instanceof Error ? error.message : "カテゴリの追加に失敗しました",
			);
		}
	};

	return {
		categories,
		handleAddNewCategory,
	};
};

/**
 * リンク保存のカスタムフック
 */
export const useLinkSaver = (
	user: User | null,
	addPost: (post: PostItem) => void,
) => {
	const router = useRouter();

	const handleSaveLink = async (url: string) => {
		try {
			if (!user) {
				alert("ログインが必要です。");
				router.push("/login");
				return;
			}

			const newPost = await saveLinkAndTransform(url, user);
			console.log("リンクが保存されました:", newPost);

			// 新しいリンクを投稿リストに追加
			addPost(newPost);

			alert(`リンクが正常に保存されました: ${newPost.title}`);
		} catch (error) {
			console.error("リンク保存エラー:", error);
			alert("リンクの保存に失敗しました。再度お試しください。");
		}
	};

	return {
		handleSaveLink,
	};
};

/**
 * ナビゲーション関連のカスタムフック
 */
export const useNavigation = () => {
	const router = useRouter();

	const handleSearchResultClick = (postId: string) => {
		router.push(`/link/${postId}`);
	};

	const handleCategoryClick = (categoryId: string) => {
		router.push(`/category/${categoryId}`);
	};

	return {
		handleSearchResultClick,
		handleCategoryClick,
	};
};

/**
 * ホームページ全体のロジックを統合するカスタムフック
 */
export const useHomePage = (user: User | null) => {
	const { posts, addPost } = usePosts();
	const { categories, handleAddNewCategory } = useCategories();
	const { handleSaveLink } = useLinkSaver(user, addPost);
	const { handleSearchResultClick, handleCategoryClick } = useNavigation();

	return {
		// データ
		posts,
		categories,
		// ハンドラー
		handleAddNewCategory,
		handleSaveLink,
		handleSearchResultClick,
		handleCategoryClick,
	};
};
