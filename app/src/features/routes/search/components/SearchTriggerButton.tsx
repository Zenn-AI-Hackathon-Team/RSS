import { Search } from "lucide-react";
import { SEARCH_CONFIG } from "../constants";
import type { SearchTriggerButtonProps } from "../types";

/**
 * 検索ダイアログを開くトリガーボタンコンポーネント
 */
export const SearchTriggerButton = ({
	onClick,
	placeholder = SEARCH_CONFIG.PLACEHOLDER.DEFAULT,
}: SearchTriggerButtonProps) => (
	<button
		onClick={onClick}
		onKeyDown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onClick();
			}
		}}
		className="relative flex h-10 w-full items-center rounded-md border border-input bg-slate-100 px-3 py-2 text-sm text-slate-500 ring-offset-background cursor-pointer text-left hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
		type="button"
		aria-label={SEARCH_CONFIG.ARIA_LABELS.OPEN_DIALOG}
	>
		<Search className="absolute w-5 h-5 text-slate-400 left-3" />
		<span className="pl-7">{placeholder}</span>
	</button>
);
