"use client";

import { AlertCircle, FolderOpen, Loader2, Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { CategoryWithCount } from "@/app/src/types/categoryItem/types";
import type { PostItem } from "@/app/src/types/postItem/types";
import { CategoryCard } from "./CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/app/src/providers/AuthProvider";
import { addCategory } from "../endpoint";

interface CategoryContainerProps {
    categories: CategoryWithCount[];
    posts: PostItem[];
    onCategoryClick: (categoryId: string) => void;
    onAddNewCategory: () => void;
    loading?: boolean;
    error?: string | null;
    onRefreshCategories?: () => void;
}

const CategoryContainer: React.FC<CategoryContainerProps> = ({
    categories,
    onCategoryClick,
    onAddNewCategory,
    loading = false,
    error = null,
    onRefreshCategories,
}) => {
    const { getToken, user } = useAuth();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");

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
                            id={cat.id}
                            title={cat.name}
                            description={cat.description ?? undefined}
                            count={cat.count} // APIから取得したcountを直接使用
                            onClick={() => onCategoryClick(cat.id)}
                            onChanged={onRefreshCategories}
                        />
                    ))}
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center h-25 border-2 border-dashed rounded-lg cursor-pointer border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-6 h-6" />
                    <p className="mt-1 text-sm font-semibold">カテゴリを追加</p>
                </button>
            </div>

            {/* Create Category Dialog */}
            <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>カテゴリを作成</DialogTitle>
                        <DialogDescription>名前と説明を入力してください（説明は任意）。</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <label htmlFor="new-cat-name" className="text-sm font-medium">名前</label>
                            <Input id="new-cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="カテゴリ名" />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="new-cat-desc" className="text-sm font-medium">説明（任意）</label>
                            <Input id="new-cat-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="説明" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>キャンセル</Button>
                        <Button
                            onClick={async () => {
                                if (!user) { alert("ログインが必要です"); return; }
                                if (!name.trim()) { alert("名前を入力してください"); return; }
                                try {
                                    setSaving(true);
                                    await addCategory(name.trim(), getToken, desc.trim() || null);
                                    setOpen(false);
                                    setName("");
                                    setDesc("");
                                    onRefreshCategories?.();
                                } catch (e) {
                                    console.error(e);
                                    alert(e instanceof Error ? e.message : "作成に失敗しました");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                        >
                            {saving ? "作成中..." : "作成"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CategoryContainer;
