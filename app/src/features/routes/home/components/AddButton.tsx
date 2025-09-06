"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddButtonProps = {
	onSubmit?: (url: string) => Promise<void> | void;
};

export function AddButton({ onSubmit }: AddButtonProps) {
	const [open, setOpen] = React.useState(false);
	const [url, setUrl] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(false);

	const urlInputId = React.useId();
	const errorId = React.useId();

	const validate = (v: string) => {
		try {
			new URL(v);
			return true;
		} catch {
			return false;
		}
	};

	const handleSave = async () => {
		setError(null);
		if (!url.trim()) {
			setError("URLを入力してください");
			return;
		}
		if (!validate(url.trim())) {
			setError("正しいURL形式ではありません");
			return;
		}
		try {
			setLoading(true);
			await onSubmit?.(url.trim());
			setOpen(false);
			setUrl("");
		} catch (_e) {
			setError("保存に失敗しました。もう一度お試しください。");
		} finally {
			setLoading(false);
		}
	};

	const handleDialogOpenChange = (newOpen: boolean) => {
		if (!loading) {
			setOpen(newOpen);
			if (!newOpen) {
				// ダイアログを閉じる際にフォームをリセット
				setUrl("");
				setError(null);
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !loading) {
			e.preventDefault();
			handleSave();
		}
	};

	return (
		<>
			{/* FAB - 右下固定の丸いボタン */}
			<Button
				onClick={() => setOpen(true)}
				className="fixed bottom-6 right-6 h-14 w-14 bg-[#7268EC] rounded-full shadow-lg z-50 p-0 cursor-pointer hover:bg-[#5a4ee0] flex items-center justify-center"
				size="icon"
				aria-label="URLを追加"
			>
				<Plus className="h-6 w-6" />
			</Button>

			{/* URL追加ダイアログ */}
			<Dialog open={open} onOpenChange={handleDialogOpenChange}>
				<DialogContent className="w-[90vw] max-w-md mx-auto rounded-lg">
					<DialogHeader>
						<DialogTitle>✨AIでURLを追加</DialogTitle>
						<DialogDescription>
							URLをペーストすると、AIが自動でカテゴリ分類します。
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-2 py-2">
						<Label htmlFor={urlInputId}>URL</Label>
						<Input
							id={urlInputId}
							type="url"
							placeholder="https://..."
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							onKeyDown={handleKeyDown}
							aria-invalid={!!error}
							aria-describedby={error ? errorId : undefined}
							disabled={loading}
							autoComplete="url"
							className="w-full"
						/>
						{error && (
							<p id={errorId} className="text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
					</div>

					<DialogFooter className="flex flex-row justify-between gap-2">
						<Button
							variant="outline"
							onClick={() => handleDialogOpenChange(false)}
							disabled={loading}
						>
							キャンセル
						</Button>
						<Button onClick={handleSave} disabled={loading || !url.trim()}>
							{loading ? "保存中..." : "保存"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
