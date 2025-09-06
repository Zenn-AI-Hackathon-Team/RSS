import type { CategoryItem } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";

export interface UseSearchProps {
	posts: PostItem[];
	categories: CategoryItem[];
	query: string;
}

export interface UseSearchReturn {
	searchResults: PostItem[];
	hasResults: boolean;
	isEmpty: boolean;
}

export interface UseSearchDialogReturn {
	isOpen: boolean;
	query: string;
	setQuery: (query: string) => void;
	openDialog: () => void;
	closeDialog: () => void;
	handleOpenChange: (open: boolean) => void;
}

export interface SearchBoxProps {
	posts: PostItem[];
	categories: CategoryItem[];
	onResultClick: (postId: string) => void;
	placeholder?: string;
}

export interface SearchDialogProps {
	isOpen: boolean;
	query: string;
	searchResults: PostItem[];
	hasResults: boolean;
	isEmpty: boolean;
	onOpenChange: (open: boolean) => void;
	onQueryChange: (query: string) => void;
	onResultClick: (postId: string) => void;
	onClose: () => void;
}

export interface SearchResultsListProps {
	searchResults: PostItem[];
	query: string;
	hasResults: boolean;
	isEmpty: boolean;
	onResultClick: (postId: string) => void;
	onClose: () => void;
}

export interface SearchResultItemProps {
	post: PostItem;
	onClick: () => void;
}

export interface SearchTriggerButtonProps {
	onClick: () => void;
	placeholder?: string;
}

export interface SearchEmptyStateProps {
	type: "empty" | "no-results";
	query?: string;
}
