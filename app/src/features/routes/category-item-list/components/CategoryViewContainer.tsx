// CategoryViewContainer.tsx
"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MemoItem } from "../../../../types/memoitem/types";
import CategoryHeader from "./CategoryHeader";
import CategoryItemList from "./CategoryItemList";
import { useAuth } from "@/app/src/providers/AuthProvider";
import { getCategories } from "../../category/endpoint";
import { useRouter } from "next/navigation";

type Props = {
    memoitems: MemoItem[];
    categoryId?: string;
};

const CategoryViewContainer: React.FC<Props> = ({ memoitems, categoryId }) => {
    const router = useRouter();
    const { getToken } = useAuth();
    const [categoryName, setCategoryName] = useState("カテゴリ");
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [sortBy, setSortBy] = useState<string>("newest");
    const [items, setItems] = useState<MemoItem[]>([...memoitems]);
    // reflect incoming fetch results
    useEffect(() => {
        setItems([...memoitems]);
    }, [memoitems]);
    const [categoryDesc, setCategoryDesc] = useState<string>("");

    // Fetch category display name if id provided
    useEffect(() => {
        if (!categoryId) return;
        (async () => {
            try {
                const cats = await getCategories(getToken);
                const hit = cats.find((c) => c.id === categoryId);
                if (hit) {
                    setCategoryName(hit.name);
                    setCategoryDesc(hit.description ?? "");
                }
            } catch (e) {
                console.warn("failed to load category name", e);
            }
        })();
    }, [categoryId, getToken]);

	const toTime = (x: MemoItem) => {
		const iso = x.createdAt ?? x.updatedAt ?? null;
		return iso ? Date.parse(iso) : 0;
	};

	const handleSort = (value: string) => {
		setSortBy(value);
		const sorted = [...items];
		switch (value) {
			case "newest":
				sorted.sort((a, b) => toTime(b) - toTime(a));
				break;
			case "oldest":
				sorted.sort((a, b) => toTime(a) - toTime(b));
				break;
		}
		setItems(sorted);
	};
	const toggleEditMode = () => {
		setIsEditMode((prev) => {
			const next = !prev;
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
            categoryDescription={categoryDesc}
            onCategoryDescriptionChange={setCategoryDesc}
            categoryId={categoryId}
            onCategoryDeleted={() => router.push("/")}
        />

			<CategoryItemList
				items={items}
				isEditMode={isEditMode}
				selectedIds={selectedIds}
				onToggleSelect={onToggleSelect}
				// onItemClick={(item) => console.log("clicked:", item)}
			/>

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
