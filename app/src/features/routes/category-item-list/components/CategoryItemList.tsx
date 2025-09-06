// CategoryItemList.tsx
"use client";

import { Inbox } from "lucide-react";
import type React from "react";
import type { MemoItem } from "../../../../types/memoitem/types";
import MemoItemCard from "../../../common/memoitem/components/MemoItemCard";

type Props = {
  items: MemoItem[];
  isEditMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, checked: boolean) => void;
};

const CategoryItemList: React.FC<Props> = ({
  items,
  isEditMode,
  selectedIds,
  onToggleSelect,
}) => {
  return (
    <div className="w-full">
      <div className="space-y-4">
        {items.map((item) => (
          <MemoItemCard
            item={item}
            key={item.id}
            selectable={isEditMode}
            selected={selectedIds.has(item.id)}
            onSelectChange={(checked) => onToggleSelect(item.id, checked)}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Inbox className="w-16 h-16 text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">このcategoryは空です</p>
        </div>
      )}
    </div>
  );
};

export default CategoryItemList;
