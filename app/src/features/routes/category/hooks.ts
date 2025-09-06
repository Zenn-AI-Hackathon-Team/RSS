import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLinkSaver } from "@/app/src/features/routes/link-add/hooks";
import { useAuth } from "@/app/src/providers/AuthProvider";
import type { CategoryWithCount } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { addCategory, getCategories, initialPosts } from "./endpoint";

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
	const [categories, setCategories] = useState<CategoryWithCount[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { getToken, user } = useAuth();

	// カテゴリ一覧を取得する関数
	const fetchCategories = useCallback(async () => {
		if (!user) {
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const fetchedCategories = await getCategories(getToken);
			setCategories(fetchedCategories);
		} catch (err) {
			console.error("カテゴリの取得に失敗しました:", err);
			setError(
				err instanceof Error ? err.message : "カテゴリの取得に失敗しました",
			);
		} finally {
			setLoading(false);
		}
	}, [getToken, user]);

	// ユーザーがログインした時にカテゴリを取得
	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const handleAddNewCategory = async () => {
		const newCategoryName = prompt("新しいカテゴリ名:");
		if (!newCategoryName) return;

		if (!user) {
			alert("ログインが必要です");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// APIを使用してカテゴリを作成
			const newCategory = await addCategory(newCategoryName, getToken);

			// 作成後、カテゴリ一覧を再取得
			await fetchCategories();

			alert(`カテゴリ「${newCategory.name}」が作成されました`);
		} catch (error) {
			console.error("カテゴリの作成に失敗しました:", error);
			const errorMessage =
				error instanceof Error ? error.message : "カテゴリの追加に失敗しました";
			setError(errorMessage);
			alert(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return {
		categories,
		loading,
		error,
		handleAddNewCategory,
		fetchCategories, // 再取得用
	};
};

/**
 * ナビゲーション関連のカスタムフック
 */
export const useNavigation = () => {
	const router = useRouter();

	const handleSearchResultClick = (id: string, type: "post" | "category") => {
		if (type === "post") {
			router.push(`/link/${id}`);
		} else {
			router.push(`/category/${id}`);
		}
	};

	// SearchBox専用のハンドラー（postのみを扱う）
	const handlePostClick = (postId: string) => {
		router.push(`/link/${postId}`);
	};

	const handleCategoryClick = (categoryId: string) => {
		router.push(`/category/${categoryId}`);
	};

	return {
		handleSearchResultClick,
		handlePostClick,
		handleCategoryClick,
	};
};

/**
 * ホームページ全体のロジックを統合するカスタムフック
 */
export const useHomePage = (user: User | null) => {
	const { posts, addPost } = usePosts();
	const { categories, loading, error, handleAddNewCategory, fetchCategories } =
		useCategories();
	const { handleSearchResultClick, handlePostClick, handleCategoryClick } =
		useNavigation();
	const { handleSaveLink } = useLinkSaver(user, addPost);

	return {
		// データ
		posts,
		categories,
		loading,
		error,
		// ハンドラー
		handleAddNewCategory,
		handleSaveLink,
		handleSearchResultClick,
		handlePostClick,
		handleCategoryClick,
		fetchCategories,
	};
};
