// CategoryHeader.tsx
"use client";

import { Check, FolderOpen, MoreVertical, Pencil, Trash2, ListChecks } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import SortButton from "../../../common/sortbutton/components/SortButton";
import { useAuth } from "@/app/src/providers/AuthProvider";
import { updateCategoryName, deleteCategory } from "../../category/endpoint";

interface CategoryHeaderProps {
    sortBy: string;
    onSortChange: (value: string) => void;
    categoryName: string;
    categoryDescription?: string;

    isEditMode: boolean;
    onToggleEditMode: () => void;
    onCategoryNameChange: (name: string) => void;
    onCategoryDescriptionChange?: (desc: string) => void;
    categoryId?: string;
    onCategoryDeleted?: () => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
    sortBy,
    onSortChange,
    categoryName,
    categoryDescription,
    isEditMode,
    onToggleEditMode,
    onCategoryNameChange,
    onCategoryDescriptionChange,
    categoryId,
    onCategoryDeleted,
}) => {
    // UI-only dialog states
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editName, setEditName] = useState(categoryName);
    const [editDesc, setEditDesc] = useState<string>(categoryDescription ?? "");
    const { getToken } = useAuth();

	return (
		<div className="flex justify-between items-center mb-6">
            <div className="relative flex items-center space-x-3 min-w-0">
                <FolderOpen className="w-8 h-8 text-blue-400" />
                <h1 className="flex-1 pr-10 min-w-0 font-bold text-3xl text-black truncate">
                    {categoryName}
                </h1>
            
                {/* Move kebab menu next to the category name */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="right-0 absolute hover:bg-slate-100 text-slate-500"
                            aria-label="カテゴリー操作"
                            title="カテゴリー操作"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-50 shadow-xl border border-slate-300 rounded-md w-44">
                        <DropdownMenuItem onClick={() => { setEditName(categoryName); setEditDesc(categoryDescription ?? ""); setOpenEditDialog(true); }}>
                            <Pencil className="w-4 h-4" /> 編集
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setOpenDeleteDialog(true)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" /> 削除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                        <ListChecks className="w-5 h-5" />
                    )}
                </Button>
            </div>

            {/* Edit Category Dialog */}
            <Dialog open={openEditDialog} onOpenChange={(v) => { if (!saving) setOpenEditDialog(v); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>カテゴリを編集</DialogTitle>
                        <DialogDescription>名称を変更できます。</DialogDescription>
                    </DialogHeader>
                    <div className="gap-4 grid py-2">
                        <div className="gap-2 grid">
                            <label htmlFor="cat-name" className="font-medium text-sm">
                                名前
                            </label>
                            {/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
                            <Input id="cat-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="カテゴリ名" />
                        </div>
                        <div className="gap-2 grid">
                            <label htmlFor="cat-desc" className="font-medium text-sm">
                                説明（任意）
                            </label>
                            {/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
                            <Input id="cat-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="説明" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEditDialog(false)} disabled={saving}>
                            キャンセル
                        </Button>
                        <Button onClick={async () => {
                            if (!categoryId) { alert("カテゴリIDがありません"); return; }
                            if (!editName.trim()) { alert("名前を入力してください"); return; }
                            try {
                                setSaving(true);
                                const res = await updateCategoryName(categoryId, editName.trim(), getToken, editDesc.trim() || null);
                                onCategoryNameChange(res.name);
                                onCategoryDescriptionChange?.(res.description ?? "");
                                setOpenEditDialog(false);
                            } catch (e) {
                                console.error(e);
                                alert(e instanceof Error ? e.message : "更新に失敗しました");
                            } finally {
                                setSaving(false);
                            }
                        }} disabled={saving}> {saving ? "保存中..." : "保存"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={(v) => { if (!deleting) setOpenDeleteDialog(v); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>カテゴリを削除しますか？</DialogTitle>
                        <DialogDescription>この操作は取り消せません。関連するリンクは Inbox に移動します。</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-muted-foreground text-sm">
                        実行するとすぐに反映されます。
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>
                            キャンセル
                        </Button>
                        <Button variant="destructive" onClick={async () => {
                            if (!categoryId) { alert("カテゴリIDがありません"); return; }
                            try {
                                setDeleting(true);
                                await deleteCategory(categoryId, getToken);
                                setOpenDeleteDialog(false);
                                onCategoryDeleted?.();
                            } catch (e) {
                                console.error(e);
                                alert(e instanceof Error ? e.message : "削除に失敗しました");
                            } finally {
                                setDeleting(false);
                            }
                        }} disabled={deleting}>
                            {deleting ? "削除中..." : "削除する"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
		</div>
	);
};

export default CategoryHeader;
