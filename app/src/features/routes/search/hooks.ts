import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/src/providers/AuthProvider";
import { searchLinks } from "./endpoint";
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
	// posts/categories は後方互換のため受け取るが、検索はAPIで実施
	const { user } = useAuth();
	const [searchResults, setSearchResults] = useState<
		UseSearchReturn["searchResults"]
	>([]);
	const q = (query || "").trim();
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!q) {
			setSearchResults([]);
			return;
		}
		// 文字数しきい値（1文字以上で検索）とデバウンス
		debounceRef.current = setTimeout(async () => {
			try {
				if (!user) {
					setSearchResults([]);
					return;
				}
				const res = await searchLinks({ q, limit: 20 }, user);
				setSearchResults(res.items);
			} catch {
				// フェイルセーフ: ローカル簡易フィルタにフォールバック
				const lower = q.toLowerCase();
				const filtered = posts.filter((post) => {
					const cat = categories.find((c) => c.id === post.categoryId);
					const text = `${post.title} ${cat?.name || ""}`.toLowerCase();
					return text.includes(lower);
				});
				setSearchResults(filtered);
			}
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [q, user, posts, categories]);

	return {
		searchResults,
		hasResults: searchResults.length > 0,
		isEmpty: q !== "" && searchResults.length === 0,
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
