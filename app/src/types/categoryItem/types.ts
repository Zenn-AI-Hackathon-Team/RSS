import type { PostItem } from "../postItem/types";

export interface CategoryItem {
    id: string;
    name: string;
    description?: string | null;
    count?: number;
}

export interface CategoryWithCount {
    id: string;
    name: string;
    description?: string | null;
    count: number;
}

export interface CategoryContainerProps {
	categories: CategoryWithCount[];
	posts: PostItem[];
	onCategoryClick: (categoryId: string) => void;
	onAddNewCategory: () => void;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string | null;
}

export interface CreateCategoryResponse {
    id: string;
    name: string;
    description?: string | null;
    count?: number;
}

export interface ErrorResponse {
	code: string;
	message: string;
}
