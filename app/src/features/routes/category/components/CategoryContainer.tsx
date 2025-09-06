"use client";

import { AlertCircle, FolderOpen, Loader2, Plus } from "lucide-react";
import type React from "react";
import type { CategoryWithCount } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { CategoryCard } from "./CategoryCard";

interface CategoryContainerProps {
	categories: CategoryWithCount[];
	posts: PostItem[];
	onCategoryClick: (categoryId: string) => void;
	onAddNewCategory: () => void;
	loading?: boolean;
	error?: string | null;
}

const CategoryContainer: React.FC<CategoryContainerProps> = ({
	categories,
	onCategoryClick,
	onAddNewCategory,
	loading = false,
	error = null,
}) => {
	return (
		<div>
			<div className="flex items-center space-x-3">
				<FolderOpen className="w-8 h-8 text-blue-400" />
				<h1 className="text-3xl font-bold text-black">カテゴリ</h1>
				{loading && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
			</div>

			{error && (
				<div className="flex items-center space-x-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
					<AlertCircle className="w-5 h-5 text-red-500" />
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
				{categories
					.filter((c) => c.id !== "inbox")
					.map((cat) => (
						<CategoryCard
							key={cat.id}
							title={cat.name}
							count={cat.count} // APIから取得したcountを直接使用
							onClick={() => onCategoryClick(cat.id)}
						/>
					))}
				<button
					type="button"
					onClick={onAddNewCategory}
					disabled={loading}
					className="flex flex-col items-center justify-center h-25 border-2 border-dashed rounded-lg cursor-pointer border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Plus className="w-6 h-6" />
					<p className="mt-1 text-sm font-semibold">カテゴリを追加</p>
				</button>
			</div>
		</div>
	);
};

export default CategoryContainer;
