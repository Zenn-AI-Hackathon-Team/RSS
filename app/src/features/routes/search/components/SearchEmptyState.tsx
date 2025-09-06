import { Search } from "lucide-react";
import { SEARCH_CONFIG } from "../constants";
import type { SearchEmptyStateProps } from "../types";

/**
 * 検索の空状態表示コンポーネント
 */
export const SearchEmptyState = ({ type, query }: SearchEmptyStateProps) => {
	if (type === "empty") {
		return (
			<div className="flex flex-col items-center justify-center py-8 px-3">
				<Search className="w-12 h-12 text-slate-300 mb-3" />
				<h3 className="text-base font-bold text-slate-600 mb-2">
					{SEARCH_CONFIG.EMPTY_STATE.TITLE}
				</h3>
				<p className="text-xs text-slate-400 text-center">
					{SEARCH_CONFIG.EMPTY_STATE.SUBTITLE}
				</p>
			</div>
		);
	}

	if (type === "no-results") {
		return (
			<div className="flex flex-col items-center justify-center py-8 px-3">
				<Search className="w-12 h-12 text-slate-300 mb-3" />
				<h3 className="text-base font-bold text-slate-600 mb-2">
					{SEARCH_CONFIG.NO_RESULTS.TITLE}
				</h3>
				<p className="text-xs text-slate-400 text-center">
					{SEARCH_CONFIG.NO_RESULTS.SUBTITLE}
					{query && (
						<>
							<br />
							<span className="font-medium">「{query}」</span>
							に一致する項目が見つかりませんでした
						</>
					)}
				</p>
			</div>
		);
	}

	return null;
};
