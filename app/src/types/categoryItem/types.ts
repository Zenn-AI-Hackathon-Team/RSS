import type { PostItem } from "../postItem/types";

export interface CategoryItem {
	id: string;
	name: string;
}

export interface CategoryContainerProps {
	categories: CategoryItem[];
	posts: PostItem[];
	onCategoryClick: (categoryId: string) => void;
	onAddNewCategory: () => void;
}
