// CategoryViewContainer.tsx
"use client";

import React, { useMemo, useState } from "react";
import CategoryItemList from "./CategoryItemList";
import CategoryHeader from "./CategoryHeader";
import { MemoItem } from "../../../../types/memoitem/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  memoitems: MemoItem[];
};

const CategoryViewContainer: React.FC<Props> = ({ memoitems }) => {
  const [sortBy, setSortBy] = useState("newest");
  const [categoryName, setCategoryName] = useState("旅行");
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [items, setItems] = useState<MemoItem[]>([...memoitems]);

  const handleSort = (value: string) => {
    setSortBy(value);
    const sorted = [...items];
    switch (value) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
    }
    setItems(sorted);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => {
      const next = !prev;
      // 編集完了（falseに戻る）時は選択解除
      if (!next) setSelectedIds(new Set());
      return next;
    });
  };

  const onToggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (checked) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  const onDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setItems((prev) => prev.filter((it) => !selectedIds.has(it.id)));
    setSelectedIds(new Set());
  };

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return (
    <div className="relative pb-24">
      <CategoryHeader
        sortBy={sortBy}
        onSortChange={handleSort}
        categoryName={categoryName}
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
        onCategoryNameChange={setCategoryName}
      />

      <CategoryItemList
        items={items}
        isEditMode={isEditMode}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        // onItemClick={(item) => console.log("clicked:", item)}
      />

      {/* 編集モード時の下部アクションバー */}
      {isEditMode && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-white shadow-lg border px-4 py-3">
            <span className="text-sm text-gray-700">
              選択中：{selectedCount} 件
            </span>
            <Button
              variant="destructive"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              選択を削除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryViewContainer;
