import SmartImage from "@/app/src/components/SmartImage";
import { SEARCH_CONFIG } from "../constants";
import type { SearchResultItemProps } from "../types";

/**
 * 検索結果の個別アイテムコンポーネント
 */
export const SearchResultItem = ({ post, onClick }: SearchResultItemProps) => (
	<button
		onClick={onClick}
		className="flex items-center space-x-4 hover:bg-slate-50 p-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full text-left transition-colors cursor-pointer focus:outline-none"
		type="button"
		aria-label={`${post.title}${SEARCH_CONFIG.ARIA_LABELS.SELECT_RESULT}`}
	>
		<SmartImage
			src={post.thumbnail}
			alt={post.title}
			width={56}
			height={56}
			className="flex-shrink-0 bg-slate-200 rounded-[20px] w-14 h-14 object-cover"
		/>
		<div className="overflow-hidden">
			<p className="font-semibold text-slate-800 truncate">{post.title}</p>
			<p className="text-slate-500 text-sm">{post.savedDate}</p>
		</div>
	</button>
);
