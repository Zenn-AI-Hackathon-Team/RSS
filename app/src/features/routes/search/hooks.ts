import { useCallback, useMemo, useState } from "react";
import type {
	UseSearchDialogReturn,
	UseSearchProps,
	UseSearchReturn,
} from "./types";

/**
 * 検索機能のカスタムフック
 * 投稿のタイトルとカテゴリ名に対して部分一致検索を行う
 */
export const useSearch = ({
	posts,
	categories,
	query,
}: UseSearchProps): UseSearchReturn => {
	const searchResults = useMemo(() => {
		if (!query.trim()) return [];

		const lowerCaseQuery = query.toLowerCase().trim();

		return posts.filter((post) => {
			const category = categories.find((c) => c.id === post.categoryId);
			const postText = `${post.title} ${category?.name || ""}`.toLowerCase();
			return postText.includes(lowerCaseQuery);
		});
	}, [query, posts, categories]);

	return {
		searchResults,
		hasResults: searchResults.length > 0,
		isEmpty: query.trim() !== "" && searchResults.length === 0,
	};
};

/**
 * 検索ダイアログの状態管理のカスタムフック
 */
export const useSearchDialog = (): UseSearchDialogReturn => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");

	const openDialog = useCallback(() => {
		setIsOpen(true);
	}, []);

	const closeDialog = useCallback(() => {
		setIsOpen(false);
		setQuery("");
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				setIsOpen(true);
			} else {
				closeDialog();
			}
		},
		[closeDialog],
	);

	return {
		isOpen,
		query,
		setQuery,
		openDialog,
		closeDialog,
		handleOpenChange,
	};
};

/**
 * 検索ボックス全体の統合ロジックのカスタムフック
 */
export const useSearchBox = ({
	posts,
	categories,
	onResultClick,
}: {
	posts: UseSearchProps["posts"];
	categories: UseSearchProps["categories"];
	onResultClick: (postId: string) => void;
}) => {
	const { isOpen, query, setQuery, openDialog, closeDialog, handleOpenChange } =
		useSearchDialog();

	const { searchResults, hasResults, isEmpty } = useSearch({
		posts,
		categories,
		query,
	});

	const handleResultClick = useCallback(
		(postId: string) => {
			closeDialog();
			onResultClick(postId);
		},
		[closeDialog, onResultClick],
	);

	return {
		// Dialog state
		isOpen,
		query,
		setQuery,
		openDialog,
		closeDialog,
		handleOpenChange,
		// Search results
		searchResults,
		hasResults,
		isEmpty,
		// Handlers
		handleResultClick,
	};
};
