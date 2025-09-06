// CategoryHeader.tsx
"use client";

import { Check, Inbox, Pencil } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SortButton from "../../../common/sortbutton/components/SortButton";

interface CategoryHeaderProps {
	sortBy: string;
	onSortChange: (value: string) => void;
	categoryName: string;

	isEditMode: boolean;
	onToggleEditMode: () => void;
	onCategoryNameChange: (name: string) => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
	sortBy,
	onSortChange,
	categoryName,
	isEditMode,
	onToggleEditMode,
	onCategoryNameChange,
}) => {
	return (
		<div className="flex items-center justify-between mb-6">
			<div className="flex items-center space-x-3">
				<Inbox className="w-8 h-8 text-blue-400" />
				{isEditMode ? (
					<div className="flex items-center gap-2">
						<Input
							value={categoryName}
							onChange={(e) => onCategoryNameChange(e.target.value)}
							className="w-48 border-2 border-gray-400"
							placeholder="カテゴリー名を入力"
						/>
					</div>
				) : (
					<h1 className="text-3xl font-bold text-black">{categoryName}</h1>
				)}
			</div>

			<div className="flex items-center gap-2">
				{!isEditMode && (
					<SortButton sortBy={sortBy} onSortChange={onSortChange} />
				)}

				<Button
					variant="ghost"
					size="icon"
					aria-label={isEditMode ? "編集完了" : "編集モード"}
					onClick={onToggleEditMode}
					title={isEditMode ? "編集完了" : "編集モード"}
				>
					{isEditMode ? (
						<Check className="w-5 h-5" />
					) : (
						<Pencil className="w-5 h-5" />
					)}
				</Button>
			</div>
		</div>
	);
};

export default CategoryHeader;
