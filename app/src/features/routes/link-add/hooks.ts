import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { PostItem } from "@/app/src/types/postItem/types";
import { useCategories, usePosts } from "../category/hooks";
import { saveLinkAndTransform } from "./endpoint";

/**
 * リンク保存のカスタムフック
 */
export const useLinkSaver = (
	user: User | null,
	addPost: (post: PostItem) => void,
	onSaveLinkComplete?: (post: PostItem) => void,
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

			// コールバック関数があれば実行（カテゴリ一覧の再取得など）
			onSaveLinkComplete?.(newPost);

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
