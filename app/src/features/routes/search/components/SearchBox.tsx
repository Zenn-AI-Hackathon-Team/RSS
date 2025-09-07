"use client";

import { useSearchBox } from "../hooks";
import type { SearchBoxProps } from "../types";
import { SearchDialog } from "./SearchDialog";
import { SearchTriggerButton } from "./SearchTriggerButton";

/**
 * 検索ボックスコンポーネント
 * 検索トリガーボタンとダイアログモーダルで構成される
 */
export const SearchBox = ({
	posts,
	categories,
	onResultClick,
	placeholder,
}: SearchBoxProps) => {
	const {
		isOpen,
		query,
		setQuery,
		openDialog,
		handleOpenChange,
		searchResults,
		hasResults,
		isEmpty,
		handleResultClick,
	} = useSearchBox({ posts, categories, onResultClick });

	return (
		<>
			<SearchTriggerButton onClick={openDialog} placeholder={placeholder} />

			<SearchDialog
				isOpen={isOpen}
				query={query}
				searchResults={searchResults}
				hasResults={hasResults}
				isEmpty={isEmpty}
				onOpenChange={handleOpenChange}
				onQueryChange={setQuery}
				onResultClick={handleResultClick}
				onClose={() => handleOpenChange(false)}
			/>
		</>
	);
};
