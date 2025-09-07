"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/app/src/providers/AuthProvider";
import { updateCategoryName, deleteCategory } from "../endpoint";

interface CategoryCardProps {
    id: string;
    title: string;
    description?: string | null;
    count: number;
    onClick: () => void;
    onChanged?: () => void;
}

export const CategoryCard = ({ id, title, description, count, onClick, onChanged }: CategoryCardProps) => {
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [name, setName] = useState(title);
    const [desc, setDesc] = useState<string>(description ?? "");
    const { getToken } = useAuth();

    return (
        <Card
            onClick={onClick}
            className="relative bg-white hover:bg-indigo-50 shadow-md hover:shadow-lg border border-gray-200 hover:border-indigo-500 h-25 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            <CardContent className="flex flex-col justify-center items-center px-4 p-2 pt-3 h-full">
                {/* Per-card action menu (UI only) */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="top-2 right-2 absolute text-slate-500 hover:bg-slate-100"
                            aria-label="カテゴリー操作"
                            title="カテゴリー操作"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-md border border-slate-300 bg-slate-50 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenuItem onClick={() => { setName(title); setDesc(description ?? ""); setOpenEditDialog(true); }}>
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

                <h3 className="mx-auto max-w-[calc(100%-3rem)] font-semibold text-center text-slate-800 truncate">
                    {title}
                </h3>
                <p className="text-slate-500 text-sm">投稿数：{count}件</p>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={(v) => { if (!saving) setOpenEditDialog(v); }}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>カテゴリを編集</DialogTitle>
                        <DialogDescription>名称を変更できます。</DialogDescription>
                    </DialogHeader>
                    <div className="gap-4 grid py-2">
                        <div className="gap-2 grid">
                            <label htmlFor="cat-name" className="font-medium text-sm">
                                名前
                            </label>
                            <input
                                id="cat-name"
                                className="px-2 py-1 border rounded"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="カテゴリ名"
                            />
                        </div>
                        <div className="gap-2 grid">
                            <label htmlFor="cat-desc" className="font-medium text-sm">
                                説明（任意）
                            </label>
                            <input
                                id="cat-desc"
                                className="px-2 py-1 border rounded"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                placeholder="説明"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenEditDialog(false)} disabled={saving}>
                            キャンセル
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!name.trim()) { alert("名前を入力してください"); return; }
                                try {
                                    setSaving(true);
                                    await updateCategoryName(id, name.trim(), getToken, desc.trim() || null);
                                    setOpenEditDialog(false);
                                    onChanged?.();
                                } catch (e) {
                                    console.error(e);
                                    alert(e instanceof Error ? e.message : "更新に失敗しました");
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                        >
                            {saving ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={(v) => { if (!deleting) setOpenDeleteDialog(v); }}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>カテゴリを削除しますか？</DialogTitle>
                        <DialogDescription>この操作は取り消せません。関連リンクは Inbox へ移動します。</DialogDescription>
                    </DialogHeader>
                    <div className="py-2 text-muted-foreground text-sm">
                        実行するとすぐに反映されます。
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>
                            キャンセル
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                try {
                                    setDeleting(true);
                                    await deleteCategory(id, getToken);
                                    setOpenDeleteDialog(false);
                                    onChanged?.();
                                } catch (e) {
                                    console.error(e);
                                    alert(e instanceof Error ? e.message : "削除に失敗しました");
                                } finally {
                                    setDeleting(false);
                                }
                            }}
                            disabled={deleting}
                        >
                            {deleting ? "削除中..." : "削除する"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
