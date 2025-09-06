import type { SearchResultsListProps } from "../types";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchResultItem } from "./SearchResultItem";

/**
 * 検索結果リストコンポーネント
 */
export const SearchResultsList = ({
	searchResults,
	query,
	hasResults,
	isEmpty,
	onResultClick,
	onClose,
}: SearchResultsListProps) => {
	const handleResultClick = (postId: string) => {
		onClose();
		onResultClick(postId);
	};

	// 入力が空の場合
	if (!query) {
		return <SearchEmptyState type="empty" />;
	}

	// 入力はあるが結果が0件の場合
	if (isEmpty) {
		return <SearchEmptyState type="no-results" />;
	}

	// 入力があり、結果がある場合
	if (hasResults) {
		return (
			<div className="space-y-1">
				{searchResults.map((post) => (
					<SearchResultItem
						key={post.id}
						post={post}
						onClick={() => handleResultClick(post.id)}
					/>
				))}
			</div>
		);
	}

	return null;
};
