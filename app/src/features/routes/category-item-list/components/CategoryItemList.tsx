// CategoryItemList.tsx
"use client";

import { Inbox } from "lucide-react";
import type React from "react";
import type { MemoItem } from "../../../../types/memoitem/types";
import MemoItemCard from "../../../common/memoitem/components/MemoItemCard";

type Props = {
	items: MemoItem[];
	onItemClick?: (item: MemoItem) => void;

	// 追加
	isEditMode: boolean;
	selectedIds: Set<number>;
	onToggleSelect: (id: number, checked: boolean) => void;
};

const CategoryItemList: React.FC<Props> = ({
	items,
	onItemClick,
	isEditMode,
	selectedIds,
	onToggleSelect,
}) => {
	return (
		<div className="w-full">
			<div className="space-y-4">
				{items.map((item) => (
					<MemoItemCard
						key={item.id}
						item={item}
						onClick={onItemClick}
						selectable={isEditMode}
						selected={selectedIds.has(item.id)}
						onSelectChange={(checked) => onToggleSelect(item.id, checked)}
					/>
				))}
			</div>

			{items.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20">
					<Inbox className="w-16 h-16 text-gray-600 mb-4" />
					<p className="text-gray-400 text-lg">Inboxは空です</p>
				</div>
			)}
		</div>
	);
};

export default CategoryItemList;
