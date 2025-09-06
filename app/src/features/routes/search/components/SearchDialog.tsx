import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SEARCH_CONFIG } from "../constants";
import type { SearchDialogProps } from "../types";
import { SearchResultsList } from "./SearchResultsList";

/**
 * 検索ダイアログコンポーネント
 */
export const SearchDialog = ({
	isOpen,
	query,
	searchResults,
	hasResults,
	isEmpty,
	onOpenChange,
	onQueryChange,
	onResultClick,
	onClose,
}: SearchDialogProps) => {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				className={`${SEARCH_CONFIG.STYLES.DIALOG.WIDTH} ${SEARCH_CONFIG.STYLES.DIALOG.MAX_WIDTH} mx-auto rounded-lg ${SEARCH_CONFIG.STYLES.DIALOG.POSITION}`}
				onKeyDown={handleKeyDown}
			>
				<DialogHeader>
					<DialogTitle>検索</DialogTitle>
				</DialogHeader>

				<div className="relative">
					<Search className="absolute w-5 h-5 text-slate-300 left-3 top-1/2 -translate-y-1/2" />
					<Input
						placeholder={SEARCH_CONFIG.PLACEHOLDER.FULL}
						className="pl-10"
						value={query}
						onChange={(e) => onQueryChange(e.target.value)}
						autoFocus
						aria-label={SEARCH_CONFIG.ARIA_LABELS.SEARCH_INPUT}
					/>
				</div>

				<div
					className={`mt-2 ${SEARCH_CONFIG.STYLES.CONTENT.MAX_HEIGHT} ${SEARCH_CONFIG.STYLES.CONTENT.MIN_HEIGHT} overflow-y-auto pr-2`}
				>
					<SearchResultsList
						searchResults={searchResults}
						query={query}
						hasResults={hasResults}
						isEmpty={isEmpty}
						onResultClick={onResultClick}
						onClose={onClose}
					/>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						キャンセル
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
