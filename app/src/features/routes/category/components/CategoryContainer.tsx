"use client";

import { Plus } from "lucide-react";
import type React from "react";
import type { CategoryItem } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { CategoryCard } from "./CategoryCard";

interface CategoryContainerProps {
	categories: CategoryItem[];
	posts: PostItem[];
	onCategoryClick: (categoryId: string) => void;
	onAddNewCategory: () => void;
}

const CategoryContainer: React.FC<CategoryContainerProps> = ({
	categories,
	posts,
	onCategoryClick,
	onAddNewCategory,
}) => {
	return (
		<div>
			<h2 className="text-lg font-bold text-slate-800">カテゴリ</h2>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
				{categories
					.filter((c) => c.id !== "inbox")
					.map((cat) => (
						<CategoryCard
							key={cat.id}
							title={cat.name}
							count={posts.filter((p) => p.categoryId === cat.id).length}
							onClick={() => onCategoryClick(cat.id)}
						/>
					))}
				<button
					type="button"
					onClick={onAddNewCategory}
					className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-500"
				>
					<Plus className="w-6 h-6" />
					<p className="mt-1 text-sm font-semibold">カテゴリを追加</p>
				</button>
			</div>
		</div>
	);
};

export default CategoryContainer;
